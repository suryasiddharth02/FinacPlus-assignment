const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');
const { DEMOQA } = require('../test-config');

const BOOK_TITLE = 'Learning JavaScript Design Patterns';
const OUTPUT_FILE = path.resolve(__dirname, '../book-details.txt');

async function dismissOverlays(page) {
  try {
    const closeBtn = page.locator('#close-fixedban');
    if (await closeBtn.isVisible({ timeout: 1500 })) {
      await closeBtn.click();
    }
  } catch { /* no overlay — continue */ }
}

async function safeClick(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await dismissOverlays(page);
  await locator.click();
}

async function waitForElement(page, selector, timeout = 15_000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

test.describe('Book Store Application — UI Tests', () => {

  test('Login, search book, validate result, save details, logout', async ({ page }) => {

    await page.goto(`${DEMOQA.BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await waitForElement(page, '#userName');

    await page.fill('#userName', DEMOQA.USERNAME);
    await page.fill('#password', DEMOQA.PASSWORD);
    await dismissOverlays(page);
    await page.click('#login');
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
    await safeClick(page, bookStoreNavLink);
    await page.waitForURL(`${DEMOQA.BASE_URL}/books`, { timeout: 10_000 });

    await page.waitForLoadState('domcontentloaded');
    const searchBox = page.locator('#searchBox');
    await expect(searchBox).toBeVisible({ timeout: 15_000 });

    await searchBox.clear();
    await searchBox.fill(BOOK_TITLE);
    await page.waitForTimeout(1500); 

    const bookTitleLink = page.getByRole('link', { name: BOOK_TITLE, exact: true }).first();
    await expect(bookTitleLink).toBeVisible({ timeout: 10_000 });
    console.log(`Book found in search results: "${BOOK_TITLE}"`);

    await safeClick(page, bookTitleLink);

    await page.waitForFunction(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      return labels.some(l => /ISBN|Author/i.test(l.textContent));
    }, { timeout: 15_000 });

    
    const bookInfo = await page.evaluate(() => {
      const result = {};

      document.querySelectorAll('label').forEach(label => {
        const key = label.textContent.replace(':', '').trim();
        if (!key) return;

        const next = label.nextElementSibling;
        if (next) result[key] = next.textContent.trim();
      });
     
      document.querySelectorAll('.row').forEach(row => {
        const cells = row.querySelectorAll('.col-md-3, .col-md-9, label, span#userName-value');
        if (cells.length >= 2) {
          const key = cells[0].textContent.replace(':', '').trim();
          const val = cells[1].textContent.trim();
          if (key && val && !result[key]) result[key] = val;
        }
      });
      return result;
    });

    console.log('Raw bookInfo keys:', Object.keys(bookInfo));

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

    const backBtn = page.getByRole('button', { name: /back to book store/i });
    await expect(backBtn).toBeVisible({ timeout: 8_000 });
    await safeClick(page, backBtn);

    await expect(searchBox).toBeVisible({ timeout: 10_000 });
    await dismissOverlays(page);

    const logoutBtn = page.locator('button', { hasText: /logout|log out/i }).first();
    await safeClick(page, logoutBtn);
    await page.waitForURL(`${DEMOQA.BASE_URL}/login`, { timeout: 10_000 });
    console.log('Successfully logged out');
  });

});
