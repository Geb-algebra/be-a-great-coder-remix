const { server } = require('./server');

server.listen({ onUnhandledRequest: 'warn' });
console.info('🔶 Mock server running');

process.once('SIGINT', () => server.close());
process.once('SIGTERM', () => server.close());
