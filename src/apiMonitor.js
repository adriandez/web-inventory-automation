import puppeteer from "puppeteer";

// Custom delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const monitorAPICalls = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set headers and User-Agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  const apiCalls = [];

  // Capture network requests
  page.on("request", (request) => {
    if (["xhr", "fetch", "websocket"].includes(request.resourceType())) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
      });
    }
  });

  console.log("Navigating to the URL...");
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  // Allow extra time for API calls
  console.log("Waiting for dynamic API calls...");
  await delay(5000);

  console.log(`Captured API calls: ${apiCalls.length}`);

  await browser.close();
  return apiCalls;
};

export default monitorAPICalls;
