import { test, expect } from '@playwright/test';
import fs from 'fs';

test('UI Automation - Book Store', async ({ page }) => {

    const username = 'stevesmith49';
    const password = 'Smith@123';
    const bookName = 'Learning JavaScript Design Patterns';

    await page.goto('https://demoqa.com/', { waitUntil: 'domcontentloaded' });

    await page.getByText('Book Store Application').click();

    await page.getByRole('button', { name: 'Login' }).click();

    await page.locator('#userName').fill(username);
    await page.locator('#password').fill(password);

    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('#userName-value')).toHaveText(username);

    const logoutBtn = page.getByRole('button', { name: /log\s*out/i });

    await page.getByRole('button', { name: 'Go To Book Store' }).click();

    const searchBox = page.locator('#searchBox');
    await searchBox.fill(bookName);
    await searchBox.press('Enter');

    const book = page.getByRole('link', { name: bookName });
    await expect(book).toBeVisible({ timeout: 15000 });

    await book.click();

    await page.waitForSelector('#userName-value', { timeout: 15000 });

    const title = await page.locator('#title-wrapper').locator('div').nth(1).innerText();
    const author = await page.locator('#author-wrapper').locator('div').nth(1).innerText();
    const publisher = await page.locator('#publisher-wrapper').locator('div').nth(1).innerText();

    console.log({ title, author, publisher });

    fs.writeFileSync(
        'bookDetails.txt',
        `Title: ${title}\nAuthor: ${author}\nPublisher: ${publisher}`
    );

    await logoutBtn.click();

    await page.pause();
});