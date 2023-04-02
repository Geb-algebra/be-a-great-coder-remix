import { prisma } from '~/db.server';

import type { Order, Problem, User } from '@prisma/client';
import {
  DIFFICULTY_STD_DEV,
  PROBLEM_TIER,
  REVENUE_STD_DEV,
  TIME_LIMIT_FOR_CLEARING_ORDER,
} from '~/game-config';
import { getUserById } from './user.server';
import { fetchIfAllowed } from './fetchLog.server';

/**
 * get the order a user is currently receiving
 * @param user: User
 * @returns Order | null: the order a user is currently receiving, or null if the user is not receiving any order
 */
export const getReceivedOrder = async (user: User) => {
  const order = await prisma.order.findFirst({
    where: {
      user: user,
      clearedDatetime: null,
      NOT: {
        receivedDatetime: null,
      },
      isFailed: false,
    },
  });
  return order;
};

/**
 * get all unreceived orders a user has
 * @param user: User
 */
export const getUnreceivedOrders = async (user: User) => {
  const orders = await prisma.order.findMany({
    where: {
      user: user,
      receivedDatetime: null,
    },
  });
  return orders;
};

/**
 * get all orders a user has been cleared ordered by the time the order was cleared
 * @param user: User
 */
export const getClearedOrders = async (user: User) => {
  const orders = await prisma.order.findMany({
    where: {
      user: user,
      NOT: {
        clearedDatetime: null,
      },
      isFailed: false,
    },
    orderBy: {
      clearedDatetime: 'desc',
    },
    include: {
      problem: true,
    },
  });
  return orders;
};

/**
 * get all orders a user has failed or cleared ordered by the time the order was cleared
 */
export const getFailedOrClearedOrders = async (user: User) => {
  const orders = await prisma.order.findMany({
    where: {
      user: user,
      NOT: {
        clearedDatetime: null,
      },
    },
    orderBy: {
      clearedDatetime: 'desc',
    },
    include: {
      problem: true,
    },
  });
  return orders;
};

/**
 * calculate the current rate of a user
 * the rate is the weighted average of the difficulty of the problems the user has solved,
 * where newly solved problems has large weight.
 * the difficulty of problems the user failed to solve are treated as zero.
 * the minimum rate is 100.
 * @param user: User
 */
export const calcCurrentRate = async (user: User) => {
  const orders = await getFailedOrClearedOrders(user);
  const weight = 0.9;
  const denominator = (weight ** orders.length - 1) / (weight - 1); // sum 0.9^i
  const numerator = orders.reduce(
    (acc, order, i) => acc + (order.isFailed ? 0 : order.problem.difficulty * weight ** i),
    0,
  );
  if (denominator === 0 || numerator / denominator <= 100) {
    return 100;
  } else {
    return Math.floor(numerator / denominator);
  }
};

/**
 * draw a random number from a lognormal distribution
 * @param mean: number
 * @param std: number
 */
const drawLognormal = (mean: number, std: number) => {
  const u = Math.random();
  const v = Math.random();
  const x = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.exp(x * std + mean);
};

/**
 * get a suitable problem tier for a user
 * @param user: User
 */
export const getSuitableProblemTier = async (user: User) => {
  const rate = await calcCurrentRate(user);
  const drawnDifficulty = drawLognormal(rate, DIFFICULTY_STD_DEV);
  const tier = PROBLEM_TIER.find((tier) => tier[0] < drawnDifficulty && drawnDifficulty <= tier[1]);
  if (tier === undefined) {
    throw new Error('tier is undefined');
  }
  return tier;
};

/**
 * get a suitable problem for a user
 * @param user: User
 */
export const getSuitableProblem = async (user: User) => {
  const tier = await getSuitableProblemTier(user);
  const problems = await prisma.problem.findMany({
    where: {
      difficulty: {
        gt: tier[0],
        lte: tier[1],
      },
    },
  });
  const problemIdsInUnreceivedOrder = await getUnreceivedOrders(user).then((orders) =>
    orders.map((order) => order.problemId),
  );
  const problemIdInReceivingOrder = (await getReceivedOrder(user))?.problemId;
  const problemIdsInOrder = [...problemIdsInUnreceivedOrder, problemIdInReceivingOrder];
  const problemsWithoutOrder = problems.filter(
    (problem) => !problemIdsInOrder.includes(problem.id),
  );
  return problemsWithoutOrder[Math.floor(Math.random() * problemsWithoutOrder.length)];
};

/**
 * make a new order for a user with a given problem
 * @param user: User
 */
export const createOrderWithProblem = async (user: User, problem: Problem) => {
  const order = await prisma.order.create({
    data: {
      fixedRevenue: drawLognormal(problem.difficulty, REVENUE_STD_DEV),
      variableRevenue: drawLognormal(problem.difficulty, REVENUE_STD_DEV),
      user: {
        connect: {
          id: user.id,
        },
      },
      problem: {
        connect: {
          id: problem.id,
        },
      },
    },
  });
  return order;
};

/**
 * make a new order for a user with a random problem
 * @param user: User
 */
export const createOrder = async (user: User) => {
  const problem = await getSuitableProblem(user);
  return createOrderWithProblem(user, problem);
};

/**
 * receive an order
 * @param order: Order
 * @param investment: number
 * @returns Order: the updated order
 * @throws Error: if the order is already received
 * @throws Error: if there is another order the user is currently receiving
 */
export const receiveOrder = async (order: Order, investment: number) => {
  if (order.receivedDatetime !== null) {
    throw new Error('order is already received');
  }
  const user = await prisma.user.findUnique({
    where: {
      id: order.userId,
    },
  });
  if (user === null) {
    throw new Error('user not found');
  }
  const receivedOrder = await getReceivedOrder(user);
  if (receivedOrder !== null) {
    throw new Error('another order is already received');
  }
  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      receivedDatetime: new Date(),
      investment,
    },
  });
  return updatedOrder;
};

/**
 * check if an order is cleared within the TIME_LIMIT_FOR_CLEARING_ORDER
 * @param order: Order
 */
export const isOrderCleared = async (order: Order) => {
  if (order.receivedDatetime === null) {
    throw new Error('order is not received');
  }
  const submissions: {
    id: number;
    epoch_second: number;
    problem_id: string;
    contest_id: string;
    user_id: string;
    language: string;
    point: number;
    length: number;
    result: string;
    execution_time: number;
  }[] = await fetchIfAllowed(
    `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${
      (
        await getUserById(order.userId)
      )?.name
    }&from_second=${order.receivedDatetime.getTime() / 1000}`,
    0,
  )
    .then((res) => res?.json())
    .catch((err) => {
      throw new Error(err);
    });
  const submissionsWithinTimeLimit = submissions.filter((submission) => {
    if (order.receivedDatetime === null) throw new Error('order is not received');
    return (
      submission.result === 'AC' &&
      submission.epoch_second <=
        (order.receivedDatetime.getTime() + TIME_LIMIT_FOR_CLEARING_ORDER) / 1000
    );
  });
  return submissionsWithinTimeLimit.some(
    (submission) => submission.result === 'AC' && submission.problem_id === order.problemId,
  );
};

/**
 * check if an order is failed, i.e. an order has not cleared yet and the TIME_LIMIT_FOR_CLEARING_ORDER has passed
 * @param order: Order
 */
export const isOrderFailed = async (order: Order) => {
  if (order.receivedDatetime === null) {
    throw new Error('order is not received');
  }
  if (order.clearedDatetime !== null) {
    throw new Error('order is already cleared');
  }
  return (
    !(await isOrderCleared(order)) &&
    order.receivedDatetime.getTime() + TIME_LIMIT_FOR_CLEARING_ORDER < new Date().getTime()
  );
};

/**
 * update the order status.
 * turn it clear if it is cleared within the TIME_LIMIT_FOR_CLEARING_ORDER,
 * turn it failed if the TIME_LIMIT_FOR_CLEARING_ORDER has passed without clearing the problem,
 * do nothing otherwise
 * @param order: Order
 * @returns Order: the updated order
 * @throws Error: if the order is not received
 * @throws Error: if the order is already cleared or failed
 */
export const updateOrderStatus = async (order: Order) => {
  if (order.receivedDatetime === null) {
    throw new Error('order is not received');
  }
  if (order.clearedDatetime !== null) {
    throw new Error('order is already cleared');
  }
  if (await isOrderCleared(order)) {
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        clearedDatetime: new Date(),
      },
    });
    return updatedOrder;
  } else if (await isOrderFailed(order)) {
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        isFailed: true,
      },
    });
    return updatedOrder;
  } else {
    return order;
  }
};

/**
 * Forcefully set the order status to failed
 * @param order: Order
 * @returns Order: the updated order
 */
export const forceFailOrder = async (order: Order) => {
  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      isFailed: true,
    },
  });
  return updatedOrder;
};

/**
 * calculate the total profit of a user
 * @param user: User
 * @returns number: the total profit
 * @throws Error: if the user is not found
 */
export const calcTotalProfit = async (user: User) => {
  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
    },
  });
  const totalProfit = orders.reduce((acc, order) => {
    if (order.receivedDatetime !== null) {
      acc -= order.investment ?? 0;
      if (order.clearedDatetime !== null) {
        acc +=
          order.fixedRevenue +
          order.variableRevenue *
            0.001 *
            (TIME_LIMIT_FOR_CLEARING_ORDER -
              (order.clearedDatetime.getTime() - order.receivedDatetime.getTime()));
      }
    }
    return acc;
  }, 0);
  return totalProfit;
};
