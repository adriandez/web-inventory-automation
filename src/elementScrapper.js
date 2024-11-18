import puppeteer from "puppeteer";

// Custom delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrapeElements = async (url) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set a custom User-Agent to avoid bot detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36"
  );

  console.log("Navigating to the URL...");
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  // Wait for the page to fully load
  console.log("Waiting for content to stabilize...");
  await delay(3000); // Replace waitForTimeout with delay

  console.log("Extracting elements...");
  const elements = await page.evaluate(() => {
    const elementsList = [];
    document.querySelectorAll("*").forEach((el) => {
      elementsList.push({
        tagName: el.tagName.toLowerCase(),
        id: el.id || null,
        classes:
          el.className && typeof el.className === "string"
            ? el.className.split(/\s+/)
            : [], // Safely split class names
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {}),
      });
    });
    return elementsList;
  });

  console.log(`Parsed elements count: ${elements.length}`);

  await browser.close();
  return elements;
};

export default scrapeElements;
