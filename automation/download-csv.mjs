// download-csv.mjs
//
// Logs into a web service, clicks a download button, and saves the
// resulting CSV to your Desktop.
//
// IMPORTANT: The selectors below are placeholders. You must update the
// values marked with TODO to match the real service. Open the site in a
// browser, right-click the username field / password field / login button /
// download button, choose "Inspect", and copy a stable selector (prefer
// id, name, or a stable data-* attribute over auto-generated class names).
//
// Usage:
//   1. cd automation
//   2. npm install
//   3. npx playwright install chromium
//   4. copy .env.example to .env and fill in the values
//   5. node download-csv.mjs

import { chromium } from 'playwright';
import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// ---- Configuration (from .env) ---------------------------------------------
const LOGIN_URL = process.env.LOGIN_URL;
const USERNAME = process.env.SERVICE_USERNAME;
const PASSWORD = process.env.SERVICE_PASSWORD;

if (!LOGIN_URL || !USERNAME || !PASSWORD) {
  console.error(
    'Missing config. Set LOGIN_URL, SERVICE_USERNAME, and SERVICE_PASSWORD in automation/.env'
  );
  process.exit(1);
}

// ---- Selectors (TODO: update these for your service) ------------------------
const SELECTORS = {
  username: '#username',        // TODO: real username field selector
  password: '#password',        // TODO: real password field selector
  loginButton: 'button[type="submit"]', // TODO: real login button selector
  // Where to navigate after login to reach the download (optional).
  downloadPageUrl: process.env.DOWNLOAD_PAGE_URL || '',
  downloadButton: 'text=Download', // TODO: real download button selector
};

const DESKTOP_DIR = path.join(os.homedir(), 'Desktop');

async function main() {
  // headless: false so you can watch it work and handle any surprises (2FA, etc.)
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  try {
    console.log(`Opening ${LOGIN_URL}`);
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    console.log('Filling in credentials...');
    await page.fill(SELECTORS.username, USERNAME);
    await page.fill(SELECTORS.password, PASSWORD);

    console.log('Submitting login...');
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.click(SELECTORS.loginButton),
    ]);

    if (SELECTORS.downloadPageUrl) {
      console.log(`Navigating to download page ${SELECTORS.downloadPageUrl}`);
      await page.goto(SELECTORS.downloadPageUrl, { waitUntil: 'networkidle' });
    }

    console.log('Triggering download...');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click(SELECTORS.downloadButton),
    ]);

    const suggested = download.suggestedFilename() || 'download.csv';
    const target = path.join(DESKTOP_DIR, suggested);
    await download.saveAs(target);

    console.log(`Saved CSV to: ${target}`);
  } catch (err) {
    const shot = path.join(DESKTOP_DIR, 'automation-error.png');
    try {
      await page.screenshot({ path: shot, fullPage: true });
      console.error(`Something failed. Screenshot saved to ${shot}`);
    } catch {}
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
