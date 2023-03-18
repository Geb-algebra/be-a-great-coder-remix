const { rest } = require('msw');
const { setupServer } = require('msw/node');
const { atcoderUserPageMock } = require('./atcoder-user-page');
const { USERNAME, PASSWORD } = require('./consts');

const server = setupServer(atcoderUserPageMock);

server.listen({ onUnhandledRequest: 'warn' });
console.info('🔶 Mock server running');

process.once('SIGINT', () => server.close());
process.once('SIGTERM', () => server.close());
