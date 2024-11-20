import fs from 'fs-extra';
import path from 'path';
import scrapeElements from './elementScrapper.js';
import monitorAPICalls from './apiMonitor.js';
import { generateAnalytics } from './analytics.js';
import dotenv from 'dotenv';
import pLimit from 'p-limit';
import { logger } from './logger.js';
import { login } from './login.js';

dotenv.config();

const requiresLogin = process.env.REQUIRES_LOGIN === 'true';
const loginUrl = process.env.LOGIN_URL;
const credentials = {
  username: process.env.USERNAME,
  password: process.env.PASSWORD
};

const urlsFile = process.env.URLS_FILE || './urls.txt';
const outputDir = path.resolve(process.env.OUTPUT_DIR || './output');
const concurrencyLimit = parseInt(process.env.CONCURRENCY_LIMIT, 10) || 3;
const limit = pLimit(concurrencyLimit);

const deriveFolderName = (url) => {
  const parsedUrl = new URL(url);
  const baseName = parsedUrl.hostname.replace(/\./g, '_');
  const pathName =
    parsedUrl.pathname.replace(/\//g, '_').substring(1) || 'home';
  return `${baseName}_${pathName}`;
};

const takeScreenshot = async (page, folderPath) => {
  const screenshotPath = path.join(folderPath, 'screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  logger.info(`Screenshot saved: ${screenshotPath}`);
};

const processUrl = async (url, page, attempt = 1) => {
  logger.start(`Processing URL: ${url} (Attempt ${attempt})`);

  try {
    const folderName = deriveFolderName(url);
    const folderPath = path.join(outputDir, folderName);
    await fs.ensureDir(folderPath);

    logger.info(`Monitoring API calls before navigation: ${url}`);
    const apiCallsBefore = await monitorAPICalls(page);

    logger.info(`Navigating to URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    logger.info(`Taking screenshot for: ${url}`);
    await takeScreenshot(page, folderPath);

    logger.info(`Scraping web elements for: ${url}`);
    const elements = await scrapeElements(page, url, folderPath);

    logger.info(`Monitoring API calls after navigation: ${url}`);
    const apiCallsAfter = await monitorAPICalls(page);

    logger.info(`Saving results for URL: ${url}`);
    await fs.writeFile(
      path.join(folderPath, 'elements.json'),
      JSON.stringify(elements, null, 2)
    );

    await fs.writeFile(
      path.join(folderPath, 'apiCalls.json'),
      JSON.stringify([...apiCallsBefore, ...apiCallsAfter], null, 2)
    );

    logger.success(`Results saved successfully for URL: ${url}`);
  } catch (error) {
    if (attempt < 3) {
      logger.warn(
        `Error processing URL: ${url} on attempt ${attempt}. Retrying...`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return processUrl(url, page, attempt + 1);
    } else {
      logger.error(`Failed to process URL: ${url}. Error: ${error.message}`);
    }
  } finally {
    logger.end(`Task completed for URL: ${url}`);
  }
};

const run = async () => {
  if (!fs.existsSync(urlsFile)) {
    logger.error(`URLs file not found: ${urlsFile}`);
    return;
  }

  const urls = fs
    .readFileSync(urlsFile, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (urls.length === 0) {
    logger.error('No URLs found in the input file.');
    return;
  }

  let browser, page;

  if (requiresLogin) {
    logger.info('Starting login process...');
    try {
      ({ browser, page } = await login(loginUrl, credentials));
    } catch (error) {
      logger.error('Failed to log in. Exiting process.');
      return;
    }
  } else {
    logger.info('Skipping login...');
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  }

  const tasks = urls.map((url) =>
    limit(() =>
      processUrl(url, page).catch((error) =>
        logger.error(`Unexpected error: ${error.message}`)
      )
    )
  );

  await Promise.all(tasks);

  logger.info('Generating analytics...');
  try {
    await generateAnalytics(outputDir);
    logger.success('Analytics generated successfully.');
  } catch (error) {
    logger.error(`Error during analytics generation: ${error.message}`);
  }

  await browser.close();
  logger.end('Workflow completed.');
};

run().catch((error) => logger.error(`Critical error: ${error.message}`));
