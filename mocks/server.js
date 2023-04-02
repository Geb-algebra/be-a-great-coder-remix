const { rest } = require('msw');
const { setupServer } = require('msw/node');
const { detailedProblemsMock } = require('./detailed-problems');
const { atcoderUserPageMock } = require('./atcoder-user-page');
const { submissionsMock } = require('./submissions');

module.exports = {
  server: setupServer(atcoderUserPageMock, detailedProblemsMock),
};
