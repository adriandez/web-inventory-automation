import fs from "fs-extra";
import path from "path";
import scrapeElements from "./elementScrapper.js";
import monitorAPICalls from "./apiMonitor.js";
import { generateAnalytics } from "./analytics.js";
import dotenv from "dotenv";
import pLimit from "p-limit";
import { logger } from "./logger.js";

// Load environment variables
dotenv.config();

// Parse command-line arguments
const args = process.argv.slice(2);
const argUrlsFile = args.find((arg) => arg.startsWith("urlsFile="));
const argOutput = args.find((arg) => arg.startsWith("outputDir="));

// Configuration with fallbacks
const urlsFile = argUrlsFile
  ? argUrlsFile.split("=")[1]
  : process.env.URLS_FILE || "./urls.txt";
const outputDir = path.resolve(
  argOutput ? argOutput.split("=")[1] : process.env.OUTPUT_DIR || "./output"
);

// Concurrency limit for parallel processing
const concurrencyLimit = parseInt(process.env.CONCURRENCY_LIMIT, 10) || 3;
const limit = pLimit(concurrencyLimit);

// Helper function to process each URL
const processUrl = async (url) => {
  logger.start(`Processing URL: ${url}`);
  try {
    const parentDir = path.join(
      outputDir,
      new URL(url).hostname.replace(/\./g, "_")
    );

    // Scrape elements
    logger.info(`Scraping web elements for: ${url}`);
    const elements = await scrapeElements(url, outputDir);

    // Monitor API calls
    logger.info(`Monitoring API calls for: ${url}`);
    const apiCalls = await monitorAPICalls(url);

    // Save results
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
    logger.end(`Completed task for: ${url}`);
  }
};

// Main function
const run = async () => {
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
  await generateAnalytics(outputDir);
};

// Run the workflow
run().catch((error) => logger.error(`Critical Error: ${error.message}`));
