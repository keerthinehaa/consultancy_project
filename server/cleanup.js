const fs = require('fs');
const path = require('path');

const modelDir = path.join(__dirname, 'model_cache');
if (fs.existsSync(modelDir)) {
  fs.rmSync(modelDir, { recursive: true });
  console.log('Cleared model cache');
}