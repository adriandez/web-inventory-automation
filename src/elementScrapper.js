import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';

// Custom delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeElements = async (page, url, folderPath) => {
  logger.start(`Scraping elements from URL: ${url}`);

  try {
    logger.info(`Waiting for content to stabilize on: ${url}`);
    await delay(5000);

    const elements = await page.evaluate(() => {
      const extractAttributes = (el) =>
        Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {});

      const elementsList = [];
      const selectors = [
        'input',
        'button',
        'a',
        'input[type="checkbox"]',
        'input[type="radio"]'
      ];

      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          elementsList.push({
            tagName: el.tagName.toLowerCase(),
            id: el.id || null,
            classes: el.className?.split(/\s+/) || [],
            attributes: extractAttributes(el)
          });
        });
      });

      return elementsList;
    });

    if (elements.length === 0) {
      logger.warn(`No elements found on the page: ${url}`);
    }

    const elementsPath = path.join(folderPath, 'elements.json');
    await fs.writeFile(elementsPath, JSON.stringify(elements, null, 2), 'utf8');

    logger.success(`Elements successfully scraped and saved: ${elementsPath}`);
    return elements;
  } catch (error) {
    logger.error(
      `Error during element scraping for URL: ${url}. Error: ${error.message}`
    );
    throw error;
  }
};

export default scrapeElements;
