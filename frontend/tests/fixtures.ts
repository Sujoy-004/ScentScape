import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// Define fixture interface for authenticated context
interface AuthFixtures {
  authenticatedPage: Page;
}

// Create base fixture with auth setup
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context }: { page: Page; context: BrowserContext }, use) => {
    // Mock authenticated state by setting auth token in localStorage
    const token = 'test-jwt-token-' + Date.now();
    const userId = 'test-user-' + Date.now();

    // Initialize localStorage with auth tokens
    await page.evaluate(({ token: t, userId: u }) => {
      localStorage.setItem('auth_token', t);
      localStorage.setItem('user_id', u);
    }, { token, userId });

    // Set cookie as well (for middleware)
    await context.addCookies([
      {
        name: 'auth_token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);

    await use(page);

    // Cleanup after test
    await page.evaluate(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
    });
  },
});

export { expect };
