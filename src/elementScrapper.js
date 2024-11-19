import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import { logger } from "./logger.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeElements = async (url, outputDir) => {
  logger.start("Starting element scraping...");

  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === "true", // Dynamically set headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36"
  );

  const elements = [];

  try {
    logger.info(`Navigating to the URL: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    logger.info("Waiting for content to stabilize...");
    await delay(5000);

    logger.info("Extracting elements...");
    const extractedElements = await page.evaluate(() => {
      const elementsList = [];
      document.querySelectorAll("*").forEach((el) => {
        elementsList.push({
          tagName: el.tagName.toLowerCase(),
          id: el.id || null,
          classes:
            typeof el.className === "string"
              ? el.className.split(/\s+/).filter((cls) => cls.trim())
              : [],
          attributes: Array.from(el.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
        });
      });
      return elementsList;
    });

    elements.push(...extractedElements);
    logger.info(`Extracted ${elements.length} elements from the page.`);

    // Save results
    const dirName = new URL(url).hostname.replace(/\./g, "_");
    const parentDir = path.join(outputDir, dirName);
    fs.ensureDirSync(parentDir);

    const elementsPath = path.join(parentDir, "elements.json");
    await fs.writeFile(elementsPath, JSON.stringify(elements, null, 2), "utf8");

    logger.success(`Data successfully saved to ${elementsPath}`);
  } catch (error) {
    logger.error(`Error during element scraping: ${error.message}`);
  } finally {
    await browser.close();
    logger.end("Element scraping completed.");
  }

  return elements;
};

export default scrapeElements;
