import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { login } from './login.js';
import { logger } from './logger.js';
import scrapeElements from './elementScrapper.js';
import generateAnalytics from './analytics.js';
import pLimit from 'p-limit';

dotenv.config();

const limit = pLimit(parseInt(process.env.CONCURRENCY_LIMIT, 10) || 3);

const processUrl = async (
  browser,
  targetUrl,
  baseUrl,
  loginUrl,
  user,
  password,
  outputFolder,
  attempt = 1
) => {
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    logger.start(`Processing URL: ${targetUrl} (Attempt ${attempt})`);

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    const relativePath = targetUrl
      .replace(baseUrl, '')
      .replace(/^\//, '')
      .replace(/\/$/, '');
    const flatPath = relativePath.replace(/\//g, '_');
    const targetOutputPath = path.join(outputFolder, flatPath);

    await fs.ensureDir(targetOutputPath);

    if (page.url() === loginUrl) {
      logger.info('Login page detected. Performing login...');
      const apiCalls = await login(page, user, password, targetOutputPath);
      logger.info('API calls captured during login:', apiCalls);
      logger.success('Login successful! Navigating back to the target URL...');
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    }

    logger.start('Scraping elements from the target page...');
    await scrapeElements(page, targetUrl, targetOutputPath);

    const screenshotPath = path.join(targetOutputPath, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logger.success(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    if (attempt < 3) {
      logger.warn(
        `Error processing URL ${targetUrl} on attempt ${attempt}. Retrying...`
      );
      return processUrl(
        browser,
        targetUrl,
        baseUrl,
        loginUrl,
        user,
        password,
        outputFolder,
        attempt + 1
      );
    }
    logger.error(`Failed to process URL ${targetUrl}: ${error.message}`);
  } finally {
    if (page) await page.close();
    logger.end(`Task completed for URL: ${targetUrl}`);
  }
};

const run = async () => {
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

    const baseUrl = process.env.BASE_URL;
    const outputFolder = process.env.OUTPUT_DIR || './output';
    const loginUrl = process.env.LOGIN_URL;
    const user = process.env.USER;
    const password = process.env.PASSWORD;

    if (!baseUrl || !loginUrl || !user || !password) {
      throw new Error(
        'BASE_URL, LOGIN_URL, USER, or PASSWORD is not defined in the environment variables.'
      );
    }

    const urlsFile = path.join(process.cwd(), 'urls.txt');
    if (!fs.existsSync(urlsFile)) {
      throw new Error(`The file urls.txt does not exist at ${urlsFile}`);
    }

    const urls = (await fs.readFile(urlsFile, 'utf8'))
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      throw new Error('The urls.txt file is empty.');
    }

    logger.info(
      `Found ${urls.length} URLs in urls.txt. Starting processing...`
    );

    const tasks = urls.map((targetUrl) =>
      limit(() =>
        processUrl(
          browser,
          targetUrl,
          baseUrl,
          loginUrl,
          user,
          password,
          outputFolder
        )
      )
    );

    await Promise.all(tasks);

    logger.start('Generating analytics and PDF summaries for all URLs...');
    await generateAnalytics(outputFolder);
    logger.success('Analytics and PDF generation completed.');
  } catch (error) {
    logger.error(`Error during execution: ${error.message}`);
  } finally {
    if (browser) await browser.close();
    logger.end('Workflow completed.');
  }
};

run();
