import fs from "fs-extra";
import path from "path";
import { createCanvas } from "canvas";
import generatePDFSummary from "./pdfGenerator.js";

export const generateAnalytics = async (outputDir) => {
  const directories = await fs.readdir(outputDir);

  for (const dir of directories) {
    const dirPath = path.join(outputDir, dir);
    const elementsPath = path.join(dirPath, "elements.json");
    const apiCallsPath = path.join(dirPath, "apiCalls.json");

    const analytics = {};
    const url = deriveUrlFromDir(dir); // Derive URL from directory name

    if (fs.existsSync(elementsPath)) {
      const elements = await fs.readJSON(elementsPath);

      analytics.elements = {
        total: elements.length,
        tags: elements.reduce((acc, el) => {
          acc[el.tagName] = (acc[el.tagName] || 0) + 1;
          return acc;
        }, {}),
        uniqueClasses: [...new Set(elements.flatMap((el) => el.classes || []))],
        emptyAttributes: elements.filter(
          (el) =>
            !el.id && (!el.classes || el.classes.length === 0) && !el.attributes
        ).length,
        inlineStyles: elements.filter(
          (el) => el.attributes && el.attributes.style
        ).length,
      };
    }

    if (fs.existsSync(apiCallsPath)) {
      const apiCalls = await fs.readJSON(apiCallsPath);
      analytics.apiCalls = {
        total: apiCalls.length,
        methods: apiCalls.reduce((acc, call) => {
          acc[call.method] = (acc[call.method] || 0) + 1;
          return acc;
        }, {}),
        endpoints: apiCalls.reduce((acc, call) => {
          acc[call.url] = (acc[call.url] || 0) + 1;
          return acc;
        }, {}),
      };
    }

    // Add the URL to the analytics summary
    analytics.url = url;

    // Save analytics JSON for this URL
    const analyticsPath = path.join(dirPath, "analytics.json");
    await fs.writeJSON(analyticsPath, analytics, { spaces: 2 });
    console.log(`Analytics generated for: ${dirPath}`);

    // Generate visualizations for this URL
    const visualizations = generateVisualizations(analytics, dirPath);

    // Generate a PDF summary for this URL
    await generatePDFSummary(analytics, dirPath, visualizations);
  }

  console.log("Analytics generation completed for all URLs.");
};

const deriveUrlFromDir = (dir) => {
  // Example: Convert directory names like "example_com" to "https://example.com"
  return `https://${dir.replace(/_/g, ".")}`;
};

const generateVisualizations = (analytics, dirPath) => {
  const canvasWidth = 800;
  const canvasHeight = 600;
  const visualizations = {};

  if (analytics.elements && analytics.elements.tags) {
    const tagCanvas = createCanvas(canvasWidth, canvasHeight);
    const tagCtx = tagCanvas.getContext("2d");

    createBarChart(tagCtx, "Top HTML Tags", analytics.elements.tags);

    const tagsPath = path.join(dirPath, "top_tags_chart.png");
    fs.writeFileSync(tagsPath, tagCanvas.toBuffer("image/png"));
    console.log("Generated tag frequency bar chart:", tagsPath);
    visualizations.tags = tagsPath;
  }

  if (analytics.apiCalls && analytics.apiCalls.methods) {
    const methodCanvas = createCanvas(canvasWidth, canvasHeight);
    const methodCtx = methodCanvas.getContext("2d");

    createPieChart(methodCtx, "API Call Methods", analytics.apiCalls.methods);

    const methodsPath = path.join(dirPath, "api_methods_chart.png");
    fs.writeFileSync(methodsPath, methodCanvas.toBuffer("image/png"));
    console.log("Generated API method pie chart:", methodsPath);
    visualizations.methods = methodsPath;
  }

  return visualizations;
};

const createBarChart = (ctx, title, data) => {
  const labels = Object.keys(data);
  const values = Object.values(data);

  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText(title, 10, 30);

  const barWidth = 50;
  const gap = 20;
  const maxHeight = 300;
  const maxValue = Math.max(...values);

  values.forEach((value, index) => {
    const barHeight = (value / maxValue) * maxHeight;
    ctx.fillStyle = getRandomColor();
    ctx.fillRect(
      50 + index * (barWidth + gap),
      400 - barHeight,
      barWidth,
      barHeight
    );
    ctx.fillStyle = "#ffffff";
    ctx.fillText(labels[index], 50 + index * (barWidth + gap), 420);
  });
};

const createPieChart = (ctx, title, data) => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  let startAngle = 0;

  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText(title, 10, 30);

  Object.entries(data).forEach(([label, value]) => {
    const sliceAngle = (value / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(400, 300);
    ctx.arc(400, 300, 200, startAngle, startAngle + sliceAngle);
    ctx.closePath();

    ctx.fillStyle = getRandomColor();
    ctx.fill();

    startAngle += sliceAngle;

    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `${label}: ${value}`,
      10,
      60 + 20 * Object.keys(data).indexOf(label)
    );
  });
};

const getRandomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16)}`;
