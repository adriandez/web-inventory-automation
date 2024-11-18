import fs from "fs-extra";
import path from "path";
import scrapeElements from "./elementScrapper.js";
import monitorAPICalls from "./apiMonitor.js";
import { fileURLToPath } from "url";

// Resolve directory paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, "../output");

const run = async () => {
  const url = "https://www.imdb.com/";

  console.log(`Scraping web elements from: ${url}`);
  const elements = await scrapeElements(url);

  console.log(`Monitoring API calls from: ${url}`);
  const apiCalls = await monitorAPICalls(url);

  console.log("Saving results...");
  fs.ensureDirSync(OUTPUT_DIR);

  await fs.writeFile(
    path.join(OUTPUT_DIR, "elements.json"),
    JSON.stringify(elements, null, 2)
  );
  await fs.writeFile(
    path.join(OUTPUT_DIR, "apiCalls.json"),
    JSON.stringify(apiCalls, null, 2)
  );

  console.log("Results saved to output directory.");
};

run().catch((error) => console.error("Error:", error));
