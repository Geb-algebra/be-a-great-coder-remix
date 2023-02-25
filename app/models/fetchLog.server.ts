import type { AtCoderAPIFetchLog } from '@prisma/client';

import { prisma } from '~/db.server';

export type { AtCoderAPIFetchLog } from '@prisma/client';

export const createFetchLog = async (
  endpoint: string,
  status = 200,
  timestamp?: Date, // for test data creation
): Promise<AtCoderAPIFetchLog> => {
  const record = await prisma.atCoderAPIFetchLog.create({
    data: { endpoint, status, timestamp },
  });
  return record;
};

export const getLatestFetchLog = async (
  endpoint: string,
  status = 200,
): Promise<AtCoderAPIFetchLog> => {
  const record = await prisma.atCoderAPIFetchLog.findMany({
    where: {
      AND: {
        endpoint,
        status,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 1,
  });
  return record[0];
};
