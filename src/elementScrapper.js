import puppeteer from "puppeteer";
import { logger } from "./logger.js";

// Custom delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeElements = async (url) => {
  logger.start("Starting element scraping...");

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set a custom User-Agent to avoid bot detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36"
  );

  const elements = [];

  try {
    logger.info(`Navigating to the URL: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait for the page to fully load
    logger.info("Waiting for content to stabilize...");
    await delay(3000);

    logger.info("Extracting elements...");
    const extractedElements = await page.evaluate(() => {
      const elementsList = [];
      document.querySelectorAll("*").forEach((el) => {
        elementsList.push({
          tagName: el.tagName.toLowerCase(),
          id: el.id || null,
          classes:
            el.className && typeof el.className === "string"
              ? el.className.split(/\s+/)
              : [], // Safely split class names
          attributes: Array.from(el.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
        });
      });
      return elementsList;
    });

    elements.push(...extractedElements);
  } catch (error) {
    logger.error(`Error during element scraping: ${error.message}`);
  } finally {
    await browser.close();
    logger.end("Element scraping completed.");
  }

  return elements;
};

export default scrapeElements;
