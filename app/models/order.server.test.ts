import { User, Problem, Order } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { prisma } from '~/db.server';
import {
  getReceivedOrder,
  getUnreceivedOrders,
  getClearedOrders,
  getFailedOrClearedOrders,
  calcCurrentRate,
  receiveOrder,
  updateOrderStatus,
  calcTotalProfit,
  isOrderCleared,
  isOrderFailed,
} from '~/models/order.server';
import { consts } from '~/../test/consts';
import { createUser } from './user.server';
import { updateProblemsIfAllowed } from './problem.server';
import { server } from 'mocks/server';
import { rest } from 'msw';
import { TIME_LIMIT_FOR_CLEARING_ORDER } from '~/game-config';

let user: User;

beforeAll(async () => {
  user = await createUser(consts.username, consts.password);
  await updateProblemsIfAllowed();
});

beforeEach(async () => {
  await prisma.order.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.atCoderAPIFetchLog.deleteMany();
});

afterAll(async () => {
  await prisma.user.deleteMany();
});

describe('getReceivedOrder', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          fixedRevenue: 100,
          variableRevenue: 100,
          receivedDatetime: null,
          clearedDatetime: null,
          investment: 100,
          problem: {
            connect: {
              id: probs[Math.floor(Math.random() * probs.length)].id,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }
  });
  it('should return null if the user is not receiving any order', async () => {
    const order = await getReceivedOrder(user);
    expect(order).toBeNull();
  });
  it('should return the order a user is currently receiving', async () => {
    const order = await prisma.order.findFirst({
      where: {
        user: user,
        receivedDatetime: null,
      },
    });
    await prisma.order.update({
      where: {
        id: order!.id,
      },
      data: {
        receivedDatetime: new Date(),
      },
    });
    const order2 = await getReceivedOrder(user);
    expect(order2).not.toBeNull();
    expect(order2!.id).toEqual(order!.id);
  });
  it('should return null if the user is receiving an order but the order is failed', async () => {
    const order = await prisma.order.findFirst({
      where: {
        user: user,
        receivedDatetime: null,
      },
    });
    await prisma.order.update({
      where: {
        id: order!.id,
      },
      data: {
        receivedDatetime: new Date(),
        isFailed: true,
      },
    });
    const order2 = await getReceivedOrder(user);
    expect(order2).toBeNull();
  });
});

describe('getUnreceivedOrders', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      problem: {
        connect: {
          id: probs[Math.floor(Math.random() * probs.length)].id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          ...probAttrs,
        },
      });
    }
    for (let i = 0; i < 2; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: new Date(),
          clearedDatetime: null,
          ...probAttrs,
        },
      });
    }
    for (let i = 0; i < 4; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: new Date(),
          clearedDatetime: new Date(),
          ...probAttrs,
        },
      });
    }
  });
  it('should return all unreceived orders a user has', async () => {
    const orders = await getUnreceivedOrders(user);
    expect(orders.length).toEqual(3);
  });
});

describe('getClearedOrders', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      problem: {
        connect: {
          id: probs[Math.floor(Math.random() * probs.length)].id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          ...probAttrs,
        },
      });
    }
    await prisma.order.create({
      data: {
        receivedDatetime: new Date(),
        clearedDatetime: null,
        ...probAttrs,
      },
    });
    for (let i = 0; i < 2; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: new Date(),
          clearedDatetime: null,
          ...probAttrs,
          isFailed: true,
        },
      });
    }
    for (let i = 0; i < 4; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: new Date(),
          clearedDatetime: new Date(),
          ...probAttrs,
        },
      });
    }
  });
  it('should return all orders a user has been cleared', async () => {
    const orders = await getClearedOrders(user);
    expect(orders.length).toEqual(4);
    expect(orders.every((order) => order.clearedDatetime !== null)).toBeTruthy();
  });
  it('should return orders in descending order of clearedDatetime', async () => {
    const orders = await getClearedOrders(user);
    expect(orders.every((order) => order.clearedDatetime !== null)).toBeTruthy();
    for (let i = 0; i < orders.length - 1; i++) {
      const prev = orders[i].clearedDatetime?.getTime() || Number.NEGATIVE_INFINITY;
      const next = orders[i + 1].clearedDatetime?.getTime() || Number.POSITIVE_INFINITY;
      expect(prev).toBeGreaterThanOrEqual(next);
    }
  });
});

describe('getFailedOrClearedOrders', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      problem: {
        connect: {
          id: probs[Math.floor(Math.random() * probs.length)].id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          ...probAttrs,
        },
      });
    }
    await prisma.order.create({
      data: {
        receivedDatetime: new Date(),
        clearedDatetime: null,
        ...probAttrs,
      },
    });
    for (let i = 0; i < 4; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: new Date(),
          clearedDatetime: new Date(),
          ...probAttrs,
        },
      });
    }
    for (let i = 0; i < 2; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: new Date(),
          clearedDatetime: new Date(),
          isFailed: true,
          ...probAttrs,
        },
      });
    }
  });
  it('should return all orders a user has been cleared or failed', async () => {
    const orders = await getFailedOrClearedOrders(user);
    expect(orders.length).toEqual(6);
    expect(orders.every((order) => order.clearedDatetime !== null || order.isFailed)).toBeTruthy();
  });
  it('should return orders in descending order of clearedDatetime', async () => {
    const orders = await getFailedOrClearedOrders(user);
    expect(orders.every((order) => order.clearedDatetime !== null || order.isFailed)).toBeTruthy();
    for (let i = 0; i < orders.length - 1; i++) {
      const prev = orders[i].clearedDatetime?.getTime() || Number.NEGATIVE_INFINITY;
      const next = orders[i + 1].clearedDatetime?.getTime() || Number.POSITIVE_INFINITY;
      expect(prev).toBeGreaterThanOrEqual(next);
    }
  });
});

describe('calcCurrentRate', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      problem: {
        connect: {
          id: probs[Math.floor(Math.random() * probs.length)].id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          ...probAttrs,
        },
      });
    }
    await prisma.order.create({
      data: {
        receivedDatetime: new Date(),
        clearedDatetime: null,
        ...probAttrs,
      },
    });
  });
  it.each([
    [[], 100],
    [[100], 100],
    [[100, 100, 100, 100], 100],
    [[100, 0, 100, 0], 100],
    [[100, 200, 300], 207],
    [[500, 0, 200], 223],
    [[500, 300, 2400], 1134],
  ])('should return the current rate of the user', async (difficulties, correctRate) => {
    for (const diff of difficulties) {
      const prob = await prisma.problem.create({
        data: {
          id: Math.random().toString(36).substring(2),
          title: faker.lorem.words(3),
          difficulty: diff,
        },
      });
      await prisma.order.create({
        data: {
          receivedDatetime: new Date(),
          clearedDatetime: new Date(),
          fixedRevenue: 100,
          variableRevenue: 100,
          investment: 100,
          problem: {
            connect: {
              id: prob.id,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }
    const rate = await calcCurrentRate(user);
    expect(rate).toEqual(correctRate);
  });
});

describe('receiveOrder', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      problem: {
        connect: {
          id: probs[Math.floor(Math.random() * probs.length)].id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          ...probAttrs,
        },
      });
    }
  });
  it('should receive an order', async () => {
    const orders = await getUnreceivedOrders(user);
    const order = orders[Math.floor(Math.random() * orders.length)];
    await receiveOrder(order, 10000);
    const receivedOrder = await prisma.order.findUnique({
      where: {
        id: order.id,
      },
    });
    expect(receivedOrder?.receivedDatetime).not.toBeNull();
  });
  it('should throw an error if the order is already received', async () => {
    const orders = await getUnreceivedOrders(user);
    const order = orders[Math.floor(Math.random() * orders.length)];
    await receiveOrder(order, 10000);
    await expect(receiveOrder(order, 10000)).rejects.toThrow();
  });
  it('should throw an error if there is another received order', async () => {
    const orders = await getUnreceivedOrders(user);
    const order = orders[Math.floor(Math.random() * orders.length)];
    await receiveOrder(order, 10000);
    const otherOrders = await getUnreceivedOrders(user);
    const otherOrder = otherOrders[Math.floor(Math.random() * otherOrders.length)];
    await expect(receiveOrder(otherOrder, 10000)).rejects.toThrow();
  });
});

/**
 * get an msw request handler for https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions
 * which returns a single submission with the given user, problem and epoch_second
 * @param user the user
 * @param problem the problem
 * @param epochSecond the epoch_second
 * @returns the request handler
 */
const addSubmissionHandler = (problemId: string, epochSecond: number, result = 'AC') => {
  server.use(
    rest.get('https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json([
          {
            id: 1,
            epoch_second: epochSecond,
            problem_id: problemId,
            user_id: user.name,
            language: 'Rust',
            point: 100,
            length: 100,
            result: result,
            execution_time: 100,
          },
        ]),
      );
    }),
  );
};

describe('isOrderCleared', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          ...probAttrs,
          problem: {
            connect: {
              id: probs[Math.floor(Math.random() * probs.length)].id,
            },
          },
        },
      });
    }
    await prisma.order.create({
      data: {
        receivedDatetime: new Date(),
        clearedDatetime: null,
        ...probAttrs,
        problem: {
          connect: {
            id: probs[Math.floor(Math.random() * probs.length)].id,
          },
        },
      },
    });
  });
  it('should return true if the order is cleared', async () => {
    const clearing = await getReceivedOrder(user);
    if (clearing === null || clearing.receivedDatetime === null) {
      throw new Error('No received order');
    }
    addSubmissionHandler(clearing.problemId, clearing.receivedDatetime.getTime() / 1000);
    expect(await isOrderCleared(clearing)).toBeTruthy();
  });
  it('should return false if the order is not cleared', async () => {
    const clearing = await getReceivedOrder(user);
    if (clearing === null || clearing.receivedDatetime === null) {
      throw new Error('No received order');
    }
    addSubmissionHandler(clearing.problemId, clearing.receivedDatetime.getTime() / 1000, 'WA');
    expect(await isOrderCleared(clearing)).toBeFalsy();
  });
  it('should return false if the problem is solved after the time limit has passed', async () => {
    const clearing = await getReceivedOrder(user);
    if (clearing === null || clearing.receivedDatetime === null) {
      throw new Error('No received order');
    }
    await prisma.order.update({
      where: {
        id: clearing.id,
      },
      data: {
        receivedDatetime: new Date(Date.now() - TIME_LIMIT_FOR_CLEARING_ORDER - 1000),
      },
    });
    const clearingAfterUpdate = await getReceivedOrder(user);
    if (clearingAfterUpdate === null || clearingAfterUpdate.receivedDatetime === null) {
      throw new Error('No received order');
    }
    addSubmissionHandler(clearingAfterUpdate.problemId, Date.now() / 1000 + 1);
    expect(await isOrderCleared(clearingAfterUpdate)).toBeFalsy();
  });
});

describe('isOrderFailed', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          ...probAttrs,
          problem: {
            connect: {
              id: probs[Math.floor(Math.random() * probs.length)].id,
            },
          },
        },
      });
    }
    await prisma.order.create({
      data: {
        receivedDatetime: new Date(),
        clearedDatetime: null,
        ...probAttrs,
        problem: {
          connect: {
            id: probs[Math.floor(Math.random() * probs.length)].id,
          },
        },
      },
    });
  });
  it('should return true if the order is failed', async () => {
    const received = await getReceivedOrder(user);
    await prisma.order.update({
      where: {
        id: received?.id,
      },
      data: {
        receivedDatetime: new Date(Date.now() - TIME_LIMIT_FOR_CLEARING_ORDER - 1000),
      },
    });
    const failing = await getReceivedOrder(user);
    if (!failing) {
      throw new Error('failing is null');
    }
    addSubmissionHandler(failing.problemId, Date.now() / 1000 + 1);
    const failed = await isOrderFailed(failing);
    expect(failed).toBeTruthy();
  });
  it('should return false if the order is not failed', async () => {
    const order = await getReceivedOrder(user);
    if (!order) {
      throw new Error('order is null');
    }
    addSubmissionHandler(order.problemId, Date.now() / 1000 + 1);
    const failed = await isOrderFailed(order);
    expect(failed).toBeFalsy();
  });
});

describe('updateOrderStatus', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          problem: {
            connect: {
              id: probs[Math.floor(Math.random() * probs.length)].id,
            },
          },
          ...probAttrs,
        },
      });
    }
    await prisma.order.create({
      data: {
        receivedDatetime: new Date(),
        clearedDatetime: null,
        problem: {
          connect: {
            id: probs[Math.floor(Math.random() * probs.length)].id,
          },
        },
        ...probAttrs,
      },
    });
  });
  it('should clear an order', async () => {
    const order = await prisma.order.findFirst({
      where: {
        NOT: {
          receivedDatetime: null,
        },
        clearedDatetime: null,
      },
    });
    if (!order || !order.receivedDatetime) {
      throw new Error('Order not found or not received. Mocking may be wrong.');
    }
    server.use(
      rest.get('https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions', (req, res, ctx) => {
        const userName = req.url.searchParams.get('user');
        return res(
          ctx.status(200),
          ctx.json([
            {
              id: 1,
              epoch_second: (order.receivedDatetime?.getTime() || 0) / 1000 + 100,
              problem_id: order.problemId,
              contest_id: 'abc001',
              user_id: userName,
              language: 'Rust',
              point: 100,
              length: 100,
              result: 'AC',
              execution_time: 100,
            },
          ]),
        );
      }),
    );
    await updateOrderStatus(order);
    const clearedOrder = await prisma.order.findFirst({
      where: {
        id: order.id,
      },
    });
    expect(clearedOrder?.isFailed).toBeFalsy();
    expect(clearedOrder?.clearedDatetime).not.toBeNull();
  });
  it('should fail an order', async () => {
    const origOrder = await prisma.order.findFirst({
      where: {
        NOT: {
          receivedDatetime: null,
        },
        clearedDatetime: null,
      },
    });
    if (!origOrder || !origOrder.receivedDatetime) {
      throw new Error('Order not found or not received. Mocking may be wrong.');
    }
    const order = await prisma.order.update({
      where: {
        id: origOrder.id,
      },
      data: {
        receivedDatetime: new Date(Date.now() - TIME_LIMIT_FOR_CLEARING_ORDER - 1),
      },
    });
    server.use(
      rest.get('https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions', (req, res, ctx) => {
        const userName = req.url.searchParams.get('user');
        return res(
          ctx.status(200),
          ctx.json([
            {
              id: 1,
              epoch_second: (order.receivedDatetime?.getTime() || 0) / 1000 + 100,
              problem_id: order.problemId,
              contest_id: 'abc001',
              user_id: userName,
              language: 'Rust',
              point: 100,
              length: 100,
              result: 'WA',
              execution_time: 100,
            },
          ]),
        );
      }),
    );
    await updateOrderStatus(order);
    const failedOrder = await prisma.order.findFirst({
      where: {
        id: order.id,
      },
    });
    expect(failedOrder?.isFailed).toBeTruthy();
    expect(failedOrder?.clearedDatetime).toBeNull();
  });
  it('should fail an order if the problem has been solved after the time limit elapsed', async () => {
    const origOrder = await prisma.order.findFirst({
      where: {
        NOT: {
          receivedDatetime: null,
        },
        clearedDatetime: null,
      },
    });
    if (!origOrder || !origOrder.receivedDatetime) {
      throw new Error('Order not found or not received. Mocking may be wrong.');
    }
    const order = await prisma.order.update({
      where: {
        id: origOrder.id,
      },
      data: {
        receivedDatetime: new Date(Date.now() - TIME_LIMIT_FOR_CLEARING_ORDER - 1),
      },
    });
    server.use(
      rest.get('https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions', (req, res, ctx) => {
        const userName = req.url.searchParams.get('user');
        return res(
          ctx.status(200),
          ctx.json([
            {
              id: 1,
              epoch_second: Date.now() / 1000 + 100,
              problem_id: order.problemId,
              contest_id: 'abc001',
              user_id: userName,
              language: 'Rust',
              point: 100,
              length: 100,
              result: 'AC',
              execution_time: 100,
            },
          ]),
        );
      }),
    );
    await updateOrderStatus(order);
    const failedOrder = await prisma.order.findFirst({
      where: {
        id: order.id,
      },
    });
    expect(failedOrder?.isFailed).toBeTruthy();
    expect(failedOrder?.clearedDatetime).toBeNull();
  });
});

describe('calcTotalProfit', () => {
  beforeEach(async () => {
    await updateProblemsIfAllowed();
    const probs = await prisma.problem.findMany();
    const probAttrs = {
      fixedRevenue: 100,
      variableRevenue: 100,
      investment: 100,
      problem: {
        connect: {
          id: probs[Math.floor(Math.random() * probs.length)].id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    };
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: null,
          clearedDatetime: null,
          ...probAttrs,
        },
      });
    }
    await prisma.order.create({
      data: {
        receivedDatetime: new Date(),
        clearedDatetime: null,
        ...probAttrs,
      },
    });
    const received = new Date();
    for (let i = 0; i < 3; i++) {
      await prisma.order.create({
        data: {
          receivedDatetime: received,
          clearedDatetime: received,
          ...probAttrs,
        },
      });
    }
  });
  it('should calculate total profit', async () => {
    const totalProfit = await calcTotalProfit(user);
    expect(totalProfit).toBe(539900);
  });
});
