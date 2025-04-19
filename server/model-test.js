const { pipeline } = require('@xenova/transformers');

async function testModel() {
  try {
    const classifier = await pipeline('text-classification', 
      { model: 'Xenova/bart-large-mnli' });
    const result = await classifier('I love programming!');
    console.log(result);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testModel();