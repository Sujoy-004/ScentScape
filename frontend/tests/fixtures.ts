import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { mockFragrances, mockUser, mockRecommendations } from './mocks/handlers';

// Define fixture interface for authenticated context
interface AuthFixtures {
  authenticatedPage: Page;
  apiMockedPage: Page;
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

  // New fixture: Page with API mocking enabled
  apiMockedPage: async ({ page }, use) => {
    // Mock GET /api/fragrances
    await page.route('**/api/fragrances', (route) => {
      if (route.request().url().includes('?')) {
        // Filtered request
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockFragrances),
        });
      } else {
        // All fragrances
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockFragrances),
        });
      }
    });

    // Mock GET /api/fragrances/:id
    await page.route('**/api/fragrances/*', (route) => {
      const url = route.request().url();
      const id = url.split('/').pop();
      const fragrance = mockFragrances.find((f) => f.id === id);
      
      if (fragrance) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fragrance),
        });
      } else {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found' }),
        });
      }
    });

    // Mock authentication endpoints
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: mockUser,
          token: 'mock-jwt-token-' + Date.now(),
        }),
      });
    });

    await page.route('**/api/auth/register', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { ...mockUser, id: 'new-user-' + Date.now() },
          token: 'mock-jwt-token-' + Date.now(),
        }),
      });
    });

    // Mock user profile endpoint
    await page.route('**/api/user/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    // Mock recommendations endpoint
    await page.route('**/api/recommendations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRecommendations),
      });
    });

    // Mock families endpoint
    await page.route('**/api/families', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'floral', name: 'Floral' },
          { id: 'oriental', name: 'Oriental' },
          { id: 'aromatic', name: 'Aromatic' },
        ]),
      });
    });

    // Mock wishlist endpoint
    await page.route('**/api/user/wishlist', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            wishlist: mockFragrances.filter((f) => mockUser.wishlist.includes(f.id)),
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Mock quiz submission
    await page.route('**/api/quiz/submit', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          recommendations: mockRecommendations,
        }),
      });
    });

    await use(page);
  },
});

export { expect };
