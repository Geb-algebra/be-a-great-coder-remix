import { installGlobals } from '@remix-run/node';
import '@testing-library/jest-dom/extend-expect';
import { server } from 'mocks/server';

installGlobals();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
  console.info('🔷 Mock server running');
});

beforeEach(() => server.resetHandlers());

afterAll(() => server.close());
