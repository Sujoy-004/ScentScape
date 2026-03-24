import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// This configures a request mocking server with the given request handlers.
// Used to mock API calls in Playwright E2E tests.
export const server = setupServer(...handlers);
