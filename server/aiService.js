const { pipeline } = require('@xenova/transformers');

// Add text sanitization function
function sanitizeText(text) {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove non-printable characters and excessive whitespace
  return text
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000); // Limit input size
}

async function analyzeWithLocalModel(text) {
  try {
    // Sanitize input first
    const cleanText = sanitizeText(text);
    if (!cleanText || cleanText.length < 10) {
      throw new Error('Text too short after sanitization');
    }

    const classifier = await LocalAnalyzer.getInstance();
    const result = await classifier(cleanText, {
      candidate_labels: [
        "functional requirement",
        "non-functional requirement", 
        "use case",
        "constraint"
      ]
    });

    return {
      categories: Array.isArray(result) ? result : [result],
      entities: extractSimpleEntities(cleanText),
      method: 'local'
    };
  } catch (err) {
    console.error('Local model failure:', err);
    // Ultimate fallback - return basic analysis
    return {
      categories: [{
        label: 'manual-review-needed',
        score: 1
      }],
      entities: [],
      method: 'fallback'
    };
  }
}
async function analyzeRequirements(text) {
  // First validate input
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }

  try {
    // Try Hugging Face API first
    return await analyzeWithHuggingFaceAPI(text);
  } catch (apiError) {
    console.log('API failed, trying local:', apiError.message);
    
    try {
      // Attempt local analysis
      return await analyzeWithLocalModel(text);
    } catch (localError) {
      console.error('Both API and local failed:', localError.message);
      
      // Final fallback
      return {
        categories: [{ label: 'analysis-failed', score: 1 }],
        entities: [],
        method: 'failed'
      };
    }
  }
}
function extractSimpleEntities(text) {
  if (typeof text !== 'string') return [];
  
  try {
    // More robust entity extraction
    const roles = (text.match(/\b(admin|user|manager|system)\b/gi) || [])
      .map(word => ({ 
        word, 
        entity_group: 'ROLE',
        score: 0.9 
      }));
      
    const systems = (text.match(/\b(database|API|server|interface)\b/gi) || [])
      .map(word => ({
        word,
        entity_group: 'SYSTEM', 
        score: 0.8
      }));
      
    return [...roles, ...systems];
  } catch (err) {
    console.error('Entity extraction failed:', err);
    return [];
  }
}