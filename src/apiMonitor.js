import puppeteer from 'puppeteer';
import { logger } from './logger.js';

// Custom delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const monitorAPICalls = async (url) => {
  logger.start('Starting API call monitoring...');

  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === 'true', // Dynamically set headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set headers and User-Agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36'
  );
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9'
  });

  const apiCalls = [];

  // Capture network requests
  page.on('request', (request) => {
    if (['xhr', 'fetch', 'websocket'].includes(request.resourceType())) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });

  try {
    logger.info(`Navigating to the URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Allow extra time for API calls
    logger.info('Waiting for dynamic API calls...');
    await delay(5000);
  } catch (error) {
    logger.error(`Error during API monitoring: ${error.message}`);
  } finally {
    await browser.close();
    logger.end('API call monitoring completed.');
  }

  return apiCalls;
};

export default monitorAPICalls;
