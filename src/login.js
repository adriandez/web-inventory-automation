import puppeteer from 'puppeteer';
import { logger } from './logger.js';

const isLoggedIn = async (page) => {
  try {
    // Check for a session-dependent element (e.g., a logout button or user profile)
    await page.waitForSelector('[data-qa="logout"]', {
      timeout: 5000
    });
    return true; // User is already logged in
  } catch {
    return false; // Login is required
  }
};

const performLogin = async (page, loginUrl, credentials) => {
  if (await isLoggedIn(page)) {
    logger.info('Already logged in. Skipping login process.');
    return;
  }

  try {
    logger.start('Starting login process...');
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.setViewport({ width: 1920, height: 1080 }); // Set screen resolution

    // Ensure inputs and buttons are interactable
    logger.debug(`[data-qa="login-username"] type ${credentials.username}`);
    await page.waitForSelector('[data-qa="login-username"]', {
      visible: true
    });
    await page.click('[data-qa="login-username"]');
    await page.type('[data-qa="login-username"]', 'adm.auto');

    logger.debug(`[data-qa="login-password"] type ${credentials.password}`);
    await page.waitForSelector('[data-qa="login-password"]', {
      visible: true
    });
    await page.click('[data-qa="login-password"]');
    await page.type('[data-qa="login-password"]', credentials.password);

    const button = await page.$('[data-qa="submit"]');
    const isClickable = await button.boundingBox();
    console.debug('[data-qa="submit"]', isClickable);
    await page.waitForSelector('[data-qa="submit"]', { visible: true });
    await page.click('[data-qa="submit"]');

    // Wait for login confirmation
    await page.waitForSelector('[data-qa="logout"]', {
      timeout: 60000
    });
    logger.success('Login successful!');
  } catch (error) {
    logger.error(`Login failed: ${error.message}`);
    await page.screenshot({ path: 'error-login.png' });
    throw new Error('Login process failed.');
  }
};

export const login = async (loginUrl, credentials) => {
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36'
  );

  try {
    await performLogin(page, loginUrl, credentials);
    return { browser, page }; // Return browser and page for reuse
  } catch (error) {
    await browser.close();
    throw error;
  }
};
