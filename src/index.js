import fs from "fs-extra";
import path from "path";
import scrapeElements from "./elementScrapper.js";
import monitorAPICalls from "./apiMonitor.js";
import dotenv from "dotenv";
import { generateAnalytics } from "./analytics.js";
import pLimit from "p-limit";
import { logger } from "./logger.js"; // Import your logger
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

// Concurrency limit for parallel processing
const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY_LIMIT, 10) || 3;
const limit = pLimit(CONCURRENCY_LIMIT);

// Tracking active tasks for concurrency monitoring
let activeTasks = 0;

// Helper function to process each URL
const processUrl = async (url) => {
  activeTasks++; // Increment active tasks
  logger.concurrency(`Starting task for: ${url}`, activeTasks);

  try {
    logger.info(`Scraping web elements for: ${url}`);
    const elements = await scrapeElements(url);

    logger.info(`Monitoring API calls for: ${url}`);
    const apiCalls = await monitorAPICalls(url);

    const parentDir = path.join(
      OUTPUT_DIR,
      new URL(url).hostname.replace(/\./g, "_")
    );

    logger.info(`Saving results to: ${parentDir}`);
    fs.ensureDirSync(parentDir);

    await fs.writeFile(
      path.join(parentDir, "elements.json"),
      JSON.stringify(elements, null, 2)
    );
    await fs.writeFile(
      path.join(parentDir, "apiCalls.json"),
      JSON.stringify(apiCalls, null, 2)
    );

    logger.success(`Results saved for: ${url}`);
  } catch (error) {
    logger.error(`Error processing URL ${url}: ${error.message}`);
  } finally {
    activeTasks--; // Decrement active tasks
    logger.concurrency(`Completed task for: ${url}`, activeTasks);
  }
};

// Main `run` function
const run = async () => {
  logger.start(`Reading URLs from: ${urlsFile}`);

  if (!fs.existsSync(urlsFile)) {
    logger.error(`URLs file not found: ${urlsFile}`);
    return;
  }

  const urls = fs
    .readFileSync(urlsFile, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (urls.length === 0) {
    logger.error("No URLs found in the file.");
    return;
  }

  // Process URLs in parallel with a concurrency limit
  const tasks = urls.map((url) =>
    limit(() =>
      processUrl(url).catch((error) =>
        logger.error(`Error processing URL ${url}: ${error.message}`)
      )
    )
  );

  await Promise.all(tasks);

  logger.end("Web inventory automation completed.");

  // Generate analytics after processing all URLs
  await generateAnalytics(OUTPUT_DIR);
};

// Run the workflow
run().catch((error) => logger.error(`Error: ${error.message}`));
