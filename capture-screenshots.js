const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer'],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:8080', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);
  console.log('Page loaded, taking screenshot...');

  await page.screenshot({ path: '/home/user/kesandu/screenshot-1-app.png', type: 'png' });
  console.log('Screenshot 1 saved');

  // Try clicking through onboarding
  try {
    const skipBtn = await page.$('[role="button"] >> text=Skip');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/user/kesandu/screenshot-2-main.png', type: 'png' });
      console.log('Screenshot 2 saved (main feed)');
    }
  } catch (e) {
    console.log('Could not find skip button:', e.message);
  }

  // Try other buttons
  try {
    const getStarted = await page.getByText('GET STARTED');
    if (await getStarted.count() > 0) {
      await getStarted.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/home/user/kesandu/screenshot-2-main.png', type: 'png' });
      console.log('Screenshot 2 saved (after GET STARTED)');
    }
  } catch (e) {
    // ignore
  }

  // Try entering a dojo
  try {
    const dojoBtn = await page.getByText('ENTER DOJO');
    if (await dojoBtn.count() > 0) {
      await dojoBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/home/user/kesandu/screenshot-3-dojo.png', type: 'png' });
      console.log('Screenshot 3 saved (dojo)');
    }
  } catch (e) {
    // ignore
  }

  await browser.close();
  console.log('Done');
})();
