const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');
const { DEMOQA } = require('../test-config');

const BOOK_TITLE = 'Learning JavaScript Design Patterns';
const OUTPUT_FILE = path.resolve(__dirname, '../book-details.txt');

async function dismissOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('iframe').forEach(f => f.remove());
    ['#Ad.fixedban', '#fixedban', '.modal-backdrop', '.fc-consent-root']
      .forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });
  }).catch(() => {});

  try {
    const closeBtn = page.locator('#close-fixedban');
    if (await closeBtn.isVisible({ timeout: 1000 })) {
      await closeBtn.click({ force: true });
    }
  } catch { /* no banner — continue */ }
}

async function safeClick(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await dismissOverlays(page);
  try {
    await locator.click({ timeout: 5_000 });
  } catch {
    await locator.click({ force: true });
  }
}

async function waitForVisible(page, selector, timeout = 15_000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

test.describe('Book Store Application — UI Tests', () => {

  test('Login, search book, validate result, save details, logout', async ({ page }) => {

    await page.goto(`${DEMOQA.BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await waitForVisible(page, '#userName');

    await page.fill('#userName', DEMOQA.USERNAME);
    await page.fill('#password', DEMOQA.PASSWORD);
    await dismissOverlays(page);
    await page.click('#login', { force: true });
    await page.waitForURL(`${DEMOQA.BASE_URL}/profile`, { timeout: 15_000 });

    const userNameLabel = page.locator('#userName-value').first();
    await expect(userNameLabel).toBeVisible({ timeout: 10_000 });
    await expect(userNameLabel).toHaveText(DEMOQA.USERNAME);

    const logoutButton = page.locator('button', { hasText: /logout|log out/i }).first();
    await expect(logoutButton).toBeVisible({ timeout: 8_000 });

    console.log(`Logged in as: ${await userNameLabel.textContent()}`);
    console.log('Logout button is visible');

    await dismissOverlays(page);
    const bookStoreNavLink = page.locator('.left-pannel').getByText(/^book store$/i);
    await bookStoreNavLink.scrollIntoViewIfNeeded();
    await dismissOverlays(page); 

    await bookStoreNavLink.click({ force: true });
    await page.waitForURL(`${DEMOQA.BASE_URL}/books`, { timeout: 10_000 });

    await page.waitForLoadState('domcontentloaded');
    const searchBox = page.locator('#searchBox');
    await expect(searchBox).toBeVisible({ timeout: 15_000 });

    await dismissOverlays(page);
    await searchBox.clear();
    await searchBox.fill(BOOK_TITLE);
    await page.waitForTimeout(1500); 

    const bookTitleLink = page.getByRole('link', { name: BOOK_TITLE, exact: true }).first();
    await expect(bookTitleLink).toBeVisible({ timeout: 10_000 });
    console.log(`Book found in search results: "${BOOK_TITLE}"`);

    await dismissOverlays(page);
    await bookTitleLink.click({ force: true });

    await page.waitForFunction(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      return labels.some(l => /ISBN|Author/i.test(l.textContent));
    }, { timeout: 15_000 });

    await dismissOverlays(page);

    const bookInfo = await page.evaluate(() => {
      const result = {};
      document.querySelectorAll('.row').forEach(row => {
        const labelEl = row.querySelector('label');
        if (!labelEl) return;
        const key = labelEl.textContent.replace(/:/g, '').trim();
        if (!key) return;

        const valueEl =
          row.querySelector('#userName-value') ||
          row.querySelector('.col-md-9 span')  ||
          row.querySelector('.col-md-9');
        if (!valueEl) return;

        const val = valueEl.textContent.trim();
        if (val && !val.endsWith(':')) {
          result[key] = val;
        }
      });
      return result;
    });

    console.log('Raw bookInfo:', JSON.stringify(bookInfo, null, 2));

    const title     = bookInfo['Title']     || bookInfo['Book Title'] || 'N/A';
    const author    = bookInfo['Author']    || 'N/A';
    const publisher = bookInfo['Publisher'] || 'N/A';

    console.log(`\nBook Details\n${'─'.repeat(40)}`);
    console.log(`Title     : ${title}`);
    console.log(`Author    : ${author}`);
    console.log(`Publisher : ${publisher}`);

    expect(title,     'Title should not be empty').not.toBe('N/A');
    expect(author,    'Author should not be empty').not.toBe('N/A');
    expect(publisher, 'Publisher should not be empty').not.toBe('N/A');

    const fileContent = [
      'Book Store — Search Result Details',
      '='.repeat(40),
      `Title     : ${title}`,
      `Author    : ${author}`,
      `Publisher : ${publisher}`,
      '',
      `Captured at: ${new Date().toISOString()}`,
    ].join('\n');

    fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
    console.log(`\nBook details written to: ${OUTPUT_FILE}`);

    await dismissOverlays(page);
    const backBtn = page.getByRole('button', { name: /back to book store/i });
    await expect(backBtn).toBeVisible({ timeout: 8_000 });
    await backBtn.click({ force: true });
    await expect(searchBox).toBeVisible({ timeout: 10_000 });

    await dismissOverlays(page);
    const logoutBtn = page.locator('button', { hasText: /logout|log out/i }).first();
    await logoutBtn.click({ force: true });
    await page.waitForURL(`${DEMOQA.BASE_URL}/login`, { timeout: 10_000 });
    console.log('Successfully logged out');
  });

});
