const PDFDocument = require('pdfkit');
const fs = require('fs');

function generatePDFReport(testResults, outputPath) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(outputPath));
  
  doc.fontSize(20).text('QA Test Report', { align: 'center' });
  doc.moveDown();
  
  // Summary
  doc.fontSize(14).text(`Results: ${testResults.passed ? 'PASSED' : 'FAILED'}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  
  // Detailed Results
  testResults.tests.forEach((test, index) => {
    doc.moveDown().text(`${index + 1}. ${test.title}`, { 
      underline: true,
      color: test.passed ? 'green' : 'red'
    });
    if (!test.passed) {
      doc.text(`Error: ${test.error.message}`);
      doc.image(test.screenshot, { width: 300 }); // Add screenshot path from Playwright
    }
  });
  
  doc.end();
}