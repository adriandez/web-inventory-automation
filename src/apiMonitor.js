import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const monitorAPICalls = async (page, triggerSelector, outputPath) => {
  const baseUrl = process.env.BASE_URL;
  const apiCalls = [];

  if (!baseUrl) {
    throw new Error('BASE_URL is not defined in the .env file.');
  }

  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const requestUrl = request.url();
    const method = request.method();
    const resourceType = request.resourceType();

    if (
      requestUrl.startsWith(baseUrl) &&
      ['xhr', 'fetch'].includes(resourceType)
    ) {
      apiCalls.push({
        type: 'request',
        url: requestUrl,
        method,
        resourceType,
        headers: request.headers(),
        postData: request.postData() || null
      });
    }

    request.continue();
  });

  page.on('response', async (response) => {
    const responseUrl = response.url();
    const method = response.request().method();
    const status = response.status();

    if (responseUrl.startsWith(baseUrl)) {
      apiCalls.push({
        type: 'response',
        url: responseUrl,
        method,
        status
      });
    }
  });

  if (triggerSelector) {
    logger.info('Clicking the trigger to start API monitoring...');
    await page.click(triggerSelector);
  }

  await delay(5000);

  const filteredCalls = apiCalls.map((call) => ({
    type: call.type,
    url: call.url,
    method: call.method,
    ...(call.status && { status: call.status })
  }));

  const apiOutputPath = path.join(outputPath, 'api_calls.json');
  await fs.writeFile(
    apiOutputPath,
    JSON.stringify(filteredCalls, null, 2),
    'utf8'
  );
  logger.success(`API calls saved to: ${apiOutputPath}`);

  return filteredCalls;
};

export default monitorAPICalls;
