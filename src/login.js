import puppeteer from 'puppeteer';
import { logger } from './logger.js';

const isLoggedIn = async (page) => {
  try {
    // Check for a session-dependent element (e.g., a logout button or user profile)
    await page.waitForSelector('#logoutButton', { timeout: 5000 });
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

    // Example: Replace with actual selectors and actions for your login form
    await page.type('#username', credentials.username);
    await page.type('#password', credentials.password);
    await page.click('#loginButton');

    // Wait for a session-dependent element to confirm login success
    await page.waitForSelector('#logoutButton', { timeout: 60000 });
    logger.success('Login successful!');
  } catch (error) {
    logger.error(`Login failed: ${error.message}`);
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
