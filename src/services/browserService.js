import puppeteer from "puppeteer";
import { config } from "../config.js";

/**
 * Create and configure a browser instance
 * @returns {Promise<import('puppeteer').Browser>}
 */
export async function createBrowser() {
  console.log(`🌐 Launching browser${config.useArcBrowser ? " (Arc)" : ""}...`);

  const launchOptions = {
    headless: config.headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  };

  // Use Arc browser if configured
  if (config.useArcBrowser) {
    launchOptions.executablePath = config.arcExecutablePath;
  }

  return await puppeteer.launch(launchOptions);
}

/**
 * Create and configure a new page
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<import('puppeteer').Page>}
 */
export async function createPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Set user agent to avoid detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  return page;
}
