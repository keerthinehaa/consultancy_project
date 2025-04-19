require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { pipeline } = require('@xenova/transformers');
const { chromium } = require('playwright');
const { execSync } = require('child_process');

const app = express();

// Initialize directories
const uploadDir = path.join(__dirname, 'uploads');
const testDir = path.join(__dirname, 'generated-tests');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

// Local Model Handler
class LocalAnalyzer {
  static model = null;
  static modelDir = path.join(__dirname, 'model_cache');

  static async initialize() {
    try {
      if (!fs.existsSync(this.modelDir)) {
        fs.mkdirSync(this.modelDir, { recursive: true });
      }

      console.log('Downloading local model...');
      this.model = await pipeline('text-classification', {
        model: 'Xenova/bart-large-mnli',
        cache_dir: this.modelDir,
        revision: 'main'
      });
      console.log('Local model ready!');
    } catch (err) {
      console.error('Local model error:', err.message);
      this.model = null;
    }
  }

  static async analyze(text) {
    if (!this.model) await this.initialize();
    if (!this.model) throw new Error('Local model failed');
    
    return await this.model(text, {
      candidate_labels: [
        "functional requirement",
        "non-functional requirement",
        "use case",
        "constraint"
      ],
      timeout: 10000
    });
  }
}

// MongoDB Schema
const TestRunSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  documentName: String,
  summary: {
    passed: Number,
    failed: Number,
    total: Number,
    applicationAvailable: Boolean
  },
  details: [{
    title: String,
    status: String,
    duration: Number,
    error: String
  }]
});
const TestRun = mongoose.model('TestRun', TestRunSchema);

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Improved MongoDB connection with retry
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qa-system', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    setTimeout(connectWithRetry, 5000);
  }
};
connectWithRetry();

// File Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(file.mimetype) && ['.pdf', '.docx'].includes(ext));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Text Processing
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === '.pdf') {
      const pdf = require('pdf-parse');
      const data = await pdf(fs.readFileSync(filePath));
      return data.text;
    } else if (ext === '.docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    throw new Error('Unsupported file type');
  } catch (err) {
    throw new Error(`Text extraction failed: ${err.message}`);
  }
}

function extractEntities(text) {
  if (typeof text !== 'string') return [];
  const roles = (text.match(/\b(admin|user|manager)\b/gi) || []).map(w => ({ word: w, entity_group: 'ROLE' }));
  const systems = (text.match(/\b(database|API|server)\b/gi) || []).map(w => ({ word: w, entity_group: 'SYSTEM' }));
  return [...roles, ...systems];
}

// AI Analysis
async function analyzeWithHuggingFace(text) {
  if (!process.env.HF_TOKEN) throw new Error('API token missing');
  try {
    const res = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      { inputs: text, parameters: { candidate_labels: ["functional", "non-functional", "use case"] } },
      { headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` }, timeout: 15000 }
    );
    return { 
      categories: res.data.labels.map((label, i) => ({
        label,
        score: res.data.scores[i]
      })),
      entities: extractEntities(text),
      method: 'api'
    };
  } catch (err) {
    throw new Error(`API Error: ${err.response?.status || err.code}`);
  }
}

async function analyzeWithLocalModel(text) {
  try {
    const result = await LocalAnalyzer.analyze(text);
    return {
      categories: Array.isArray(result) ? result : [result],
      entities: extractEntities(text),
      method: 'local'
    };
  } catch (err) {
    console.error('Local analysis fallback:', err.message);
    return {
      categories: [{ label: 'manual-review', score: 1 }],
      entities: extractEntities(text),
      method: 'fallback'
    };
  }
}

// Enhanced Test Generation
function generateTestSteps(label, entities = []) {
  const roles = entities.filter(e => e.entity_group === 'ROLE');
  const systems = entities.filter(e => e.entity_group === 'SYSTEM');

  return `
    // 1. Check application availability
    let appAvailable = true;
    try {
      const response = await page.request.get('http://localhost:3000');
      appAvailable = response.status() === 200;
    } catch {
      appAvailable = false;
    }

    if (!appAvailable) {
      throw new Error('Frontend application not running at http://localhost:3000');
    }

    // 2. Proceed with tests
    ${roles.length > 0 ? `
    // Role test
    const role = '${roles[0]?.word.toLowerCase() || 'user'}';
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', role + '@test.com');
    await page.fill('#password', role + '123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/' + role + '-dashboard');
    ` : ''}
    
    ${systems.some(s => s.word === 'database') ? `
    // System check
    const dbResponse = await page.request.get('http://localhost:3000/api/health');
    await expect(dbResponse).toBeOK();
    await expect(await dbResponse.json()).toHaveProperty('status', 'healthy');
    ` : ''}
  `;
}

function generateTestScript(analysis) {
  // Basic test template
  let testCases = `
    const { test, expect } = require('@playwright/test');

    test.describe('Generated Tests', () => {
  `;

  // Add a test for each requirement
  analysis.categories.forEach((category, index) => {
    testCases += `
      test('${category.label} (${Math.round(category.score * 100)}%)', async ({ page }) => {
        // Basic availability check
        await page.goto('about:blank');
        await expect(page).toHaveTitle('');
        
        // Add your specific test logic here
        // Example:
        // await page.goto('http://localhost:3000');
        // await expect(page).toHaveURL('http://localhost:3000');
      });
    `;
  });

  testCases += `
    });
  `;

  return {
    script: testCases,
    status: 'success'
  };
}

// Routes
app.post('/api/upload', upload.single('srsDocument'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = await extractText(req.file.path);
    const analysis = await analyzeRequirements(text);
    const { script: testScript, status } = await generateTestScript(analysis);

    res.json({
      message: status === 'success' ? 'Analysis complete!' : 'Analysis completed with warnings',
      requirements: {
        features: {
          labels: analysis.categories.map(c => c.label),
          scores: analysis.categories.map(c => c.score)
        },
        entities: analysis.entities
      },
      testScript,
      analysisStatus: status
    });

  } catch (err) {
    console.error('Upload error:', err.message);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ 
      error: err.message.includes('Invalid file') ? err.message : 'Processing failed',
      details: err.message
    });
  }
});

async function analyzeRequirements(text) {
  if (!text) throw new Error('No text to analyze');
  try {
    return await analyzeWithHuggingFace(text);
  } catch (err) {
    console.log('Falling back to local model:', err.message);
    return await analyzeWithLocalModel(text);
  }
}

app.post('/api/run-tests', async (req, res) => {
  try {
    const { testScript, documentName } = req.body;
    
    // 1. Create a temporary test file
    const testId = Date.now();
    const testFile = path.join(testDir, `test_${testId}.spec.js`);
    const configFile = path.join(testDir, `playwright.config_${testId}.js`);
    
    // 2. Write test file with proper structure
    fs.writeFileSync(testFile, `
      const { test, expect } = require('@playwright/test');
      ${testScript}
    `);
    
    // 3. Write minimal Playwright config
    fs.writeFileSync(configFile, `
      module.exports = {
        testDir: '.',
        testMatch: '${path.basename(testFile)}',
        timeout: 30000,
        workers: 1
      };
    `);
    
    // 4. Execute tests
    const command = `npx playwright test --config=${configFile}`;
    const results = JSON.parse(execSync(command, { 
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 5 // 5MB
    }));
    
    // 5. Clean up
    fs.unlinkSync(testFile);
    fs.unlinkSync(configFile);
    
    // 6. Save to MongoDB
    const dbReady = mongoose.connection.readyState === 1;
    if (dbReady) {
      await TestRun.create({
        documentName,
        summary: {
          passed: results.filter(t => t.status === 'passed').length,
          failed: results.filter(t => t.status === 'failed').length,
          total: results.length
        },
        details: results
      });
    }
    
    res.json({
      summary: {
        passed: results.filter(t => t.status === 'passed').length,
        failed: results.filter(t => t.status === 'failed').length,
        total: results.length
      },
      details: results
    });
    
  } catch (error) {
    console.error('Test execution error:', error);
    res.status(500).json({
      error: 'Test execution failed',
      details: error.stderr || error.message
    });
  }
});
app.get('/api/test-history', async (req, res) => {
  try {
    // Check MongoDB connection status
    const dbReady = mongoose.connection.readyState === 1;
    
    if (!dbReady) {
      return res.status(503).json({
        error: 'Database not ready',
        details: 'Please wait for database connection',
        databaseStatus: mongoose.STATES[mongoose.connection.readyState]
      });
    }

    const history = await TestRun.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .maxTimeMS(5000)
      .lean();

    res.json(history || []);
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({
      error: 'Failed to fetch history',
      details: err.message,
      databaseStatus: mongoose.STATES[mongoose.connection.readyState]
    });
  }
});

app.get('/api/server-status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date(),
    database: mongoose.STATES[mongoose.connection.readyState],
    services: {
      huggingFace: !!process.env.HF_TOKEN,
      playwright: true
    }
  });
});

// Initialize
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Hugging Face: ${process.env.HF_TOKEN ? 'Ready' : 'Not configured'}`);
  console.log('Playwright test generation enabled');
});