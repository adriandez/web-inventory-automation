import fs from 'fs-extra';
import path from 'path';
import { createCanvas } from 'canvas';
import generatePDFSummary from './pdfGenerator.js';
import { logger } from './logger.js';

export const generateAnalytics = async (outputDir) => {
  const directories = await fs.readdir(outputDir);

  for (const dir of directories) {
    const dirPath = path.join(outputDir, dir);
    const elementsPath = path.join(dirPath, 'elements.json');
    const apiCallsPath = path.join(dirPath, 'api_calls.json');

    const analytics = {};

    if (fs.existsSync(elementsPath)) {
      const elements = await fs.readJSON(elementsPath);

      analytics.elements = {
        total: elements.length,
        tags: elements.reduce((acc, el) => {
          acc[el.tagName] = (acc[el.tagName] || 0) + 1;
          return acc;
        }, {})
      };
    }

    if (fs.existsSync(apiCallsPath)) {
      const apiCalls = await fs.readJSON(apiCallsPath);

      analytics.apiCalls = {
        total: apiCalls.length,
        methods: apiCalls.reduce((acc, call) => {
          acc[call.method] = (acc[call.method] || 0) + 1;
          return acc;
        }, {})
      };
    }

    // Save analytics JSON
    const analyticsPath = path.join(dirPath, 'analytics.json');
    await fs.writeJSON(analyticsPath, analytics, { spaces: 2 });
    logger.info(`Analytics generated: ${analyticsPath}`);

    // Generate visualizations
    const visualizations = generateVisualizations(analytics, dirPath);

    // Generate PDF summary
    await generatePDFSummary(analytics, dirPath, visualizations);
  }

  logger.info('Analytics generation completed.');
};

const generateVisualizations = (analytics, dirPath) => {
  const visualizations = {};

  if (analytics.elements?.tags) {
    const tagCanvas = createCanvas(800, 600);
    const ctx = tagCanvas.getContext('2d');
    createBarChart(ctx, 'HTML Tag Frequency', analytics.elements.tags);
    const chartPath = path.join(dirPath, 'tags_chart.png');
    fs.writeFileSync(chartPath, tagCanvas.toBuffer('image/png'));
    visualizations.tags = chartPath;
  }

  if (analytics.apiCalls?.methods) {
    const methodCanvas = createCanvas(800, 600);
    const ctx = methodCanvas.getContext('2d');
    createPieChart(ctx, 'API Methods', analytics.apiCalls.methods);
    const chartPath = path.join(dirPath, 'methods_chart.png');
    fs.writeFileSync(chartPath, methodCanvas.toBuffer('image/png'));
    visualizations.methods = chartPath;
  }

  return visualizations;
};

const createBarChart = (ctx, title, data) => {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const maxValue = Math.max(...values);
  const barWidth = 40;
  const barSpacing = 20;
  const chartWidth = (barWidth + barSpacing) * labels.length;
  const chartHeight = 400;

  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, chartWidth + 100, chartHeight + 150);

  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  ctx.fillText(title, 10, 30);

  values.forEach((value, index) => {
    const barHeight = (value / maxValue) * chartHeight;
    const x = 50 + index * (barWidth + barSpacing);
    const y = chartHeight - barHeight + 50;

    ctx.fillStyle = getRandomColor();
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(value, x + barWidth / 4, y - 10);

    ctx.save();
    ctx.translate(x + barWidth / 2, chartHeight + 70);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'right';
    ctx.fillText(labels[index], 0, 0);
    ctx.restore();
  });
};

const createPieChart = (ctx, title, data) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  let startAngle = 0;

  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, 800, 600);

  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  ctx.fillText(title, 10, 30);

  Object.entries(data).forEach(([label, value]) => {
    const sliceAngle = (value / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(400, 300);
    ctx.arc(400, 300, 200, startAngle, startAngle + sliceAngle);
    ctx.closePath();

    ctx.fillStyle = getRandomColor();
    ctx.fill();

    const midAngle = startAngle + sliceAngle / 2;
    const textX = 400 + Math.cos(midAngle) * 220;
    const textY = 300 + Math.sin(midAngle) * 220;

    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, textX - 20, textY);
    ctx.fillText(value, textX - 20, textY + 15);

    startAngle += sliceAngle;
  });
};

const getRandomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16)}`;

export default generateAnalytics;
