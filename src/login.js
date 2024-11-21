import monitorAPICalls from './apiMonitor.js';
import { logger } from './logger.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const login = async (page, user, password, outputPath) => {
  if (!user || !password) {
    throw new Error(
      'USER or PASSWORD is not defined in the environment variables.'
    );
  }

  try {
    logger.log('Filling login form...');
    await page.click('[data-qa="login-inp-username"]');
    await page.type('[data-qa="login-inp-username"]', user);
    await page.click('[data-qa="login-inp-password"]');
    await page.type('[data-qa="login-inp-password"]', password);

    logger.attempting('Starting API monitoring for login...');
    const apiCalls = await monitorAPICalls(
      page,
      '[data-qa="submit-auth"]',
      outputPath
    );

    logger.info('Captured API calls during login:', apiCalls);

    logger.info('Waiting for login confirmation...');
    await delay(5000); // Use the local delay function here
    await page.waitForSelector('[data-qa="nav-menu-logout"]', {
      timeout: 10000
    });

    logger.success('Login successful!');
    return apiCalls;
  } catch (error) {
    logger.error('Login failed:', error.message);
    throw error;
  }
};
