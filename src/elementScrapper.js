import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeElements = async (page, url, folderPath) => {
  logger.start(`Scraping elements from URL: ${url}`);

  try {
    logger.info(`Waiting for content to stabilize on: ${url}`);
    await delay(5000);

    const elements = await page.evaluate(() => {
      const extractAttributes = (el) => {
        const attributes = Array.from(el.attributes).reduce((acc, attr) => {
          if (attr.value.trim() !== '') {
            acc[attr.name] = attr.value;
          }
          return acc;
        }, {});
        return Object.keys(attributes).length > 0 ? attributes : null;
      };

      const isVisible = (el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          parseFloat(style.opacity) > 0 &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0
        );
      };

      const elementsList = [];
      const selectors = [
        'button',
        'input[type="text"]',
        'ng-select',
        'app-right-panel > aside',
        'app-seres-slide-toggle',
        'app-seres-dropdown',
        'app-seres-button',
        'app-seres-radio',
        'app-main-nav-subitem > div',
        'td[data-qa]',
        'app-selectable-cell[data-qa]'
      ];

      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const attributes = extractAttributes(el);

          if (attributes && isVisible(el)) {
            elementsList.push({
              tagName: el.tagName.toLowerCase(),
              id: el.id && el.id.trim() !== '' ? el.id : undefined,
              attributes
            });
          }
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
