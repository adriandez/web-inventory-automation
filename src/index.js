import fs from "fs-extra";
import path from "path";
import scrapeElements from "./elementScrapper.js";
import monitorAPICalls from "./apiMonitor.js";
import dotenv from "dotenv";
import { generateAnalytics } from "./analytics.js";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Resolve directory paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command-line arguments
const args = process.argv.slice(2);
const argUrlsFile = args.find((arg) => arg.startsWith("urlsFile="));
const argOutput = args.find((arg) => arg.startsWith("outputDir="));

// Dynamic configuration with fallback
const urlsFile = argUrlsFile
  ? argUrlsFile.split("=")[1]
  : process.env.URLS_FILE || "./urls.txt";
const OUTPUT_DIR = path.resolve(
  argOutput ? argOutput.split("=")[1] : process.env.OUTPUT_DIR || "./output"
);

// Helper function to process each URL
const processUrl = async (url) => {
  console.log(`Starting web inventory automation for: ${url}`);

  console.log("Scraping web elements...");
  const elements = await scrapeElements(url);

  console.log("Monitoring API calls...");
  const apiCalls = await monitorAPICalls(url);

  const parentDir = path.join(
    OUTPUT_DIR,
    new URL(url).hostname.replace(/\./g, "_")
  );

  console.log(`Saving results to: ${parentDir}`);
  fs.ensureDirSync(parentDir);

  await fs.writeFile(
    path.join(parentDir, "elements.json"),
    JSON.stringify(elements, null, 2)
  );
  await fs.writeFile(
    path.join(parentDir, "apiCalls.json"),
    JSON.stringify(apiCalls, null, 2)
  );

  console.log(`Results saved for: ${url}`);
};

// Main `run` function
const run = async () => {
  console.log(`Reading URLs from: ${urlsFile}`);

  if (!fs.existsSync(urlsFile)) {
    console.error(`URLs file not found: ${urlsFile}`);
    return;
  }

  const urls = fs
    .readFileSync(urlsFile, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (urls.length === 0) {
    console.error("No URLs found in the file.");
    return;
  }

  for (const url of urls) {
    try {
      await processUrl(url);
    } catch (error) {
      console.error(`Error processing URL ${url}:`, error);
    }
  }

  console.log("Web inventory automation completed.");

  // Generate analytics after processing all URLs
  await generateAnalytics(OUTPUT_DIR);
};

// Run the workflow
run().catch((error) => console.error("Error:", error));
