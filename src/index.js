import fs from "fs-extra";
import path from "path";
import scrapeElements from "./elementScrapper.js";
import monitorAPICalls from "./apiMonitor.js";
import { logger } from "./logger.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

// Resolve directory paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get output directory and URL from .env
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, "../output");
const TARGET_URL = process.env.TARGET_URL || "https://www.imdb.com";

const run = async () => {
  logger.start(`Starting web inventory automation for: ${TARGET_URL}`);

  try {
    logger.info("Scraping web elements...");
    const elements = await scrapeElements(TARGET_URL);
    logger.success(`Scraped ${elements.length} web elements.`);

    logger.info("Monitoring API calls...");
    const apiCalls = await monitorAPICalls(TARGET_URL);
    logger.success(`Captured ${apiCalls.length} API calls.`);

    logger.info("Saving results...");
    fs.ensureDirSync(OUTPUT_DIR);

    await fs.writeFile(
      path.join(OUTPUT_DIR, "elements.json"),
      JSON.stringify(elements, null, 2)
    );
    await fs.writeFile(
      path.join(OUTPUT_DIR, "apiCalls.json"),
      JSON.stringify(apiCalls, null, 2)
    );

    logger.success(`Results saved to output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    logger.error(`Error during execution: ${error.message}`);
  } finally {
    logger.end("Web inventory automation completed.");
  }
};

run().catch((error) => logger.error(`Unhandled error: ${error.message}`));
