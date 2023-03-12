const mockUser = {
  id: '1',
  name: 'Geb',
  createdAt: new Date('2023-02-26T04:20:59.030Z'),
  updatedAt: new Date('2023-02-26T04:20:59.030Z'),
};

export const getUserById = async (userId: string) => {
  return mockUser;
};

// mock
export const getUnreceivedOrders = (userId: string) => {
  return [
    {
      id: '123456',
      fixedRevenue: 3000,
      variableRevenue: 1828,
      investment: null,
      receivedDatetime: null,
      clearedDatetime: null,
      problem: { difficulty: 200 },
      userId: mockUser.id,
      problemId: '0',
    },
    {
      id: '123457',
      fixedRevenue: 30003,
      variableRevenue: 18283,
      investment: null,
      receivedDatetime: null,
      clearedDatetime: null,
      problem: { difficulty: 400 },
      userId: mockUser.id,
      problemId: '1',
    },
    {
      id: '123458',
      fixedRevenue: 300044,
      variableRevenue: 182844,
      investment: null,
      receivedDatetime: null,
      clearedDatetime: null,
      problem: {
        difficulty: 500,
      },
      userId: mockUser.id,
      problemId: '2',
    },
  ];
};

export const getReceivedOrder = async (userId: string) => {
  return {
    id: '123459',
    fixedRevenue: 300044,
    variableRevenue: 182844,
    investment: 314144,
    receivedDatetime: new Date('2023-02-26T04:20:59.030Z'),
    clearedDatetime: null,
    problem: {
      id: '1',
      name: 'sample problem4',
      difficulty: 300,
    },
    userId: mockUser.id,
    problemId: '3',
  };
};

export const getOrderById = async (id: string, userId: string) => {
  const orders = getUnreceivedOrders(userId);
  return orders[Number(id)];
};

export const getTotalAssets = async (userId: string) => {
  return 31415926;
};

export const getCredibility = async (userId: string) => {
  return 149;
};
