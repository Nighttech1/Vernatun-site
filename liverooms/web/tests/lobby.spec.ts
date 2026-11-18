/**
 * W-57 / C-123 — Lobby UI gates (not media e2e).
 * Run: npm run test:lobby  (from liverooms/web)
 */
import { test, expect } from '@playwright/test';

const MOCK_ROOMS = {
  rooms: [
    {
      id: 'open',
      title: 'Открытая комната',
      cefr: 'any',
      description: 'Свободный разговор',
      locked: false,
      online: 2,
    },
    {
      id: 'a1',
      title: 'Только армянский A1',
      cefr: 'A1',
      description: 'Медленно и просто',
      locked: false,
      online: 0,
    },
  ],
};

test.describe('Campus lobby gates', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/lounge/rooms**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ROOMS),
      });
    });
  });

  test('desktop: stats under lead, rules, featured, no quick-enter/filters', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/campus');
    await expect(page.locator('h1.campus-hero-title')).toHaveText(
      'Голосовые комнаты',
    );
    await expect(page.getByRole('button', { name: /Быстрый вход/i })).toHaveCount(
      0,
    );
    await expect(page.locator('.campus-filter-tab')).toHaveCount(0);
    await expect(page.locator('.campus-create-card')).toHaveCount(0);

    await expect(page.locator('.campus-stats-chip--under-lead')).toBeVisible();
    await expect(page.locator('.campus-stats-chip')).toContainText(/В ЭФИРЕ/i);
    await expect(page.locator('.campus-stats-chip')).toContainText(/ОНЛАЙН/i);

    await expect(
      page.getByRole('button', { name: /Правила участия/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: /Правила участия/i }).click();
    await expect(page.getByRole('dialog')).toContainText(
      'Культура и правила общения в Кампусе',
    );
    await page.getByRole('button', { name: /Закрыть/i }).click();

    await expect(page.locator('.campus-featured-title')).toHaveText(
      'Открытая комната',
    );
    await expect(
      page.getByRole('heading', { name: 'Открытая комната', level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Только армянский A1', level: 2 }),
    ).toBeVisible();
  });

  test('mobile 390: no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/campus');
    await expect(page.locator('h1.campus-hero-title')).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
