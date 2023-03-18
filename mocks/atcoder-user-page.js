const { rest } = require('msw');
const { USERNAME, PASSWORD } = require('./consts');

module.exports = {
  atcoderUserPageMock: rest.get('https://atcoder.jp/users/:username/', (req, res, ctx) => {
    const { username } = req.params;
    if (Array.isArray(username)) {
      return res(ctx.status(400), ctx.json({}));
    } else if (username === USERNAME) {
      return res(ctx.status(200), ctx.json({}));
    } else {
      return res(ctx.status(404), ctx.json({}));
    }
  }),
};
