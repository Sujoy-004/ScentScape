import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';

async function acceptCookiesIfVisible(page: Page) {
  const acceptBtn = page.locator('#cookie-accept-all');
  if (await acceptBtn.isVisible().catch(() => false)) {
    await acceptBtn.click();
  }
}

test.describe('Main Flows (Current UX Contract)', () => {
  test('home page renders hero and primary CTAs', async ({ page }) => {
    await page.goto('/');
    await acceptCookiesIfVisible(page);

    await expect(page.getByRole('heading', { name: /Discover Your Perfect Scent/i })).toBeVisible();
    await expect(page.locator('#hero-cta-secondary')).toBeVisible();
  });

  test('public discovery pages are reachable', async ({ page }) => {
    await page.goto('/fragrances');
    await acceptCookiesIfVisible(page);
    await expect(page.getByRole('heading', { name: /Explore/i })).toBeVisible();

    await page.goto('/families');
    await expect(page.getByRole('heading', { name: /Fragrance Families/i })).toBeVisible();
  });

  test('register form validates weak submissions client-side', async ({ page }) => {
    await page.goto('/auth/register');
    await acceptCookiesIfVisible(page);

    await page.fill('#name', 'Test User');
    await page.fill('#email', `test-${Date.now()}@example.com`);
    await page.fill('#password', 'weak');
    await page.fill('#confirm-password', 'weak');

    await page.getByRole('button', { name: /Create Account/i }).click();
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('login form rejects invalid email format', async ({ page }) => {
    await page.goto('/auth/login');
    await acceptCookiesIfVisible(page);

    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'TestPassword123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    const nativeValidationMessage = await page.locator('#email').evaluate((el) => {
      const input = el as HTMLInputElement;
      return input.validationMessage;
    });
    expect(nativeValidationMessage.length).toBeGreaterThan(0);
  });

  test('profile route enforces authentication guard', async ({ page }) => {
    await page.goto('/profile');

    // Middleware redirect is preferred, client-side redirect is acceptable fallback.
    await page.waitForTimeout(1200);
    if (page.url().includes('/auth/login')) {
      await expect(page).toHaveURL(/\/auth\/login/);
      return;
    }

    await expect(page.getByRole('heading', { name: /Your Profile/i })).toHaveCount(0);
  });

  test('recommendations without auth shows guard UX or login redirect', async ({ page }) => {
    await page.goto('/recommendations');
    await page.waitForTimeout(1200);

    if (page.url().includes('/auth/login')) {
      await expect(page).toHaveURL(/\/auth\/login/);
      return;
    }

    await expect(page.getByRole('heading', { name: /Unlock Your Signature Scent/i })).toBeVisible();
    await expect(page.locator('.recommendations-error').getByRole('button', { name: /^Log In$/ })).toBeVisible();
  });

  test('authenticated fixture can access protected profile route', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/profile');
    await acceptCookiesIfVisible(page);

    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator('.nav-link', { hasText: /^Log Out$/ })).toBeVisible();
  });

  test('logout route clears auth token and returns home', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto('/auth/logout');
    await page.waitForURL('/', { timeout: 8000 });

    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenAfterLogout).toBeNull();
  });

  test('mobile viewport still renders main content', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await acceptCookiesIfVisible(page);

    await expect(page.getByRole('heading', { name: /Discover Your Perfect Scent/i })).toBeVisible();
  });
});
