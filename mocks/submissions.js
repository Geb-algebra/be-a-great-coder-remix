const { rest } = require('msw');

module.exports = {
  detailedProblemsMock: rest.get(
    'https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions',
    (req, res, ctx) => {
      return res(ctx.status(200), ctx.json([]));
    },
  ),
};
