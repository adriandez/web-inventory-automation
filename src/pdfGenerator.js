import fs from 'fs-extra';
import path from 'path';
import PDFDocument from 'pdfkit';

const generatePDFSummary = async (summary, outputDir, visualizations) => {
  const doc = new PDFDocument({ margin: 50, layout: 'landscape' });
  const pdfPath = path.join(outputDir, 'summary.pdf');

  doc.pipe(fs.createWriteStream(pdfPath));

  // Add Title
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('Web Inventory Analytics Summary', { align: 'center' });
  doc.moveDown();

  // Add URL
  doc
    .font('Helvetica')
    .fontSize(14)
    .text(`URL: ${summary.url || 'N/A'}`, {
      align: 'center',
      link: summary.url
    });
  doc.moveDown();

  // Table of Contents
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('Table of Contents:', { underline: true });
  doc
    .font('Helvetica')
    .fontSize(12)
    .list([
      '1. Summary Metrics',
      '2. Top HTML Tags',
      '3. Unique CSS Classes',
      '4. API Metrics',
      '5. Accessibility Highlights',
      '6. Charts'
    ]);
  doc.moveDown();

  let pageNumber = 1;
  doc.on('pageAdded', () => {
    pageNumber += 1;
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(`Page ${pageNumber}`, { align: 'right' });
  });

  // Summary Metrics
  doc.addPage().addNamedDestination('summary-metrics');
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('1. Summary Metrics', { underline: true });
  doc.moveDown();
  doc
    .font('Helvetica')
    .fontSize(14)
    .text(`- Total Elements: ${summary.elements?.total || 0}`)
    .text(
      `- Total Unique HTML Tags: ${
        Object.keys(summary.elements?.tags || {}).length
      }`
    );
  doc.moveDown();

  // Top HTML Tags
  doc.addPage().addNamedDestination('top-html-tags');
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('2. Top HTML Tags', { underline: true });
  doc.moveDown();
  generateTable(
    doc,
    'Top HTML Tags',
    ['Rank', 'Tag', 'Count'],
    Object.entries(summary.elements?.tags || {}).map(([tag, count], index) => [
      index + 1,
      tag,
      count
    ])
  );

  // Unique CSS Classes
  doc.addPage().addNamedDestination('unique-css-classes');
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('3. Unique CSS Classes', { underline: true });
  doc.moveDown();
  doc
    .font('Helvetica')
    .fontSize(14)
    .text(
      `Total Unique CSS Classes: ${
        (summary.elements?.uniqueClasses || []).length
      }`
    );
  generateTable(
    doc,
    'Unique CSS Classes',
    ['Rank', 'Class Name', 'Count'],
    Object.entries(summary.elements?.uniqueClasses || []).map(
      ([cls, count], index) => [index + 1, cls, count]
    )
  );

  // API Metrics
  doc.addPage().addNamedDestination('api-metrics');
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('4. API Metrics', { underline: true });
  doc.moveDown();
  doc
    .font('Helvetica')
    .fontSize(14)
    .text(`- Total API Calls: ${summary.apiCalls?.total || 0}`)
    .moveDown()
    .text('- HTTP Methods:');
  Object.entries(summary.apiCalls?.methods || {}).forEach(([method, count]) => {
    doc.text(`  - ${method}: ${count}`, { indent: 20 });
  });
  doc.moveDown();
  doc.text(
    `- Unique Endpoints: ${
      Object.keys(summary.apiCalls?.endpoints || {}).length
    }`
  );
  doc.moveDown();

  // Accessibility Highlights
  doc.addPage().addNamedDestination('accessibility-highlights');
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('5. Accessibility Highlights', { underline: true });
  doc.moveDown();
  generateTable(
    doc,
    'Accessibility Metrics',
    ['Metric', 'Count'],
    [
      ['Empty Attributes', summary.elements?.emptyAttributes || 0],
      ['Inline Styles', summary.elements?.inlineStyles || 0]
    ]
  );

  // Charts
  doc.addPage().addNamedDestination('charts');
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('6. Charts', { underline: true });
  if (visualizations.tags) {
    doc.addPage();
    doc
      .font('Helvetica')
      .fontSize(16)
      .text('Top HTML Tags Chart', { align: 'center' });
    doc.image(visualizations.tags, { fit: [700, 500], align: 'center' });
  }
  if (visualizations.methods) {
    doc.addPage();
    doc
      .font('Helvetica')
      .fontSize(16)
      .text('API Call Methods Chart', { align: 'center' });
    doc.image(visualizations.methods, { fit: [700, 500], align: 'center' });
  }

  // Footer
  doc.addPage();
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });

  doc.end();
  console.log(`Summary saved as PDF: ${pdfPath}`);
};

// Generate Table Helper Function
const generateTable = (doc, title, headers, rows) => {
  doc.font('Helvetica-Bold').fontSize(14).text(title).moveDown(0.5);

  // Draw Headers
  headers.forEach((header, index) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(header, { continued: index < headers.length - 1 });
  });
  doc.moveDown();

  // Draw Rows
  if (rows.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .text('No data available', { align: 'center' })
      .moveDown();
  } else {
    rows.forEach((row) => {
      row.forEach((cell, index) => {
        doc
          .font('Helvetica')
          .fontSize(10)
          .text(cell || '-', { continued: index < row.length - 1 });
      });
      doc.moveDown();
    });
  }
};

export default generatePDFSummary;
