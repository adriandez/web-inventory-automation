import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import monitorAPICalls from './apiMonitor.js';
import { logger } from './logger.js';

dotenv.config();

const visitedUrls = new Set(); // Track visited URLs
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Save metadata to a file
const saveMetadata = async (metadata, outputPath) => {
  const metadataFile = path.join(outputPath, 'interaction_metadata.json');
  try {
    const existingData = (await fs.readFile(metadataFile, 'utf8')) || '[]';
    const parsedData = JSON.parse(existingData);
    parsedData.push(metadata);
    await fs.writeFile(
      metadataFile,
      JSON.stringify(parsedData, null, 2),
      'utf8'
    );
    logger.success(`Metadata saved to: ${metadataFile}`);
  } catch (error) {
    logger.error(`Failed to save metadata: ${error.message}`);
  }
};

// Function to scrape and discover URLs from a domain
const scanUrls = async (page, baseUrl, outputPath) => {
  logger.start(`Scanning domain: ${baseUrl}`);
  const discoveredUrls = new Set();

  const extractLinksAndButtons = async () => {
    return await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const links = anchors
        .map((a) => a.href)
        .filter((href) => href.startsWith('http'));
      const clickableButtons = buttons.map((b) => ({
        selector: b.outerHTML,
        text: b.innerText.trim(),
        attributes: Array.from(b.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      }));
      return { links, clickableButtons };
    });
  };

  const explorePage = async (url, parentPath = '') => {
    if (visitedUrls.has(url)) return;
    visitedUrls.add(url);

    logger.info(`Exploring URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Save screenshot for the URL
    const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const screenshotPath = path.join(
      outputPath,
      `${parentPath}_${sanitizedUrl}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logger.success(`Screenshot saved for ${url}: ${screenshotPath}`);

    const { links, clickableButtons } = await extractLinksAndButtons();

    // Save page metadata
    const metadata = {
      url,
      title: await page.title(),
      links,
      clickableButtons
    };
    const metadataPath = path.join(outputPath, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    links.forEach((link) => discoveredUrls.add(link));

    // Click buttons, monitor API calls, and check for URL changes
    for (const button of clickableButtons) {
      try {
        const timestamp = new Date().toISOString();
        const initialUrl = page.url();

        // Monitor API calls triggered by button click
        const apiCalls = await monitorAPICalls(
          page,
          button.selector,
          outputPath
        );

        const metadataDetails = {
          timestamp,
          sourceUrl: initialUrl,
          pageTitle: metadata.title,
          buttonDetails: button,
          apiCalls: apiCalls || [],
          triggeredChange: {}
        };

        const newUrl = page.url();
        if (newUrl !== initialUrl) {
          metadataDetails.triggeredChange.newUrl = newUrl;
          metadataDetails.triggeredChange.type = 'fullPageNavigation';
        } else {
          metadataDetails.triggeredChange.type = 'ajax';
        }

        await saveMetadata(metadataDetails, outputPath);
      } catch (err) {
        logger.warn(`Error clicking button: ${button.text}`);
        const errorMetadata = {
          timestamp: new Date().toISOString(),
          sourceUrl: page.url(),
          error: {
            message: err.message,
            stack: err.stack
          }
        };
        await saveMetadata(errorMetadata, outputPath);
      }
    }
  };

  await explorePage(baseUrl);
  return Array.from(discoveredUrls);
};

// Main script
const run = async () => {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || process.env.BASE_URL;
  const outputFolder = args[1] || process.env.OUTPUT_DIR || './output';

  if (!baseUrl) {
    logger.error(
      'BASE_URL is not defined in arguments or environment variables.'
    );
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS === 'true',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();
    const urls = await scanUrls(page, baseUrl, outputFolder);

    // Save discovered URLs to a file
    const urlsFilePath = path.join(outputFolder, 'discovered_urls.json');
    await fs.writeFile(urlsFilePath, JSON.stringify(urls, null, 2), 'utf8');
    logger.success(`Scan complete. Found ${urls.length} unique URLs.`);
    logger.info(`Discovered URLs saved to: ${urlsFilePath}`);
  } catch (error) {
    logger.error(`Error during execution: ${error.message}`);
  } finally {
    if (browser) await browser.close();
    logger.end('Workflow completed.');
  }
};

run();
