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

/**
 * fetch from the specified endpoint if the specified interval has passed since the last fetch
 * @param endpoint: string - a full path to the endpoint
 * @param interval: number - he required fetching interval in milliseconds
 * @returns Response | undefined: the response from the endpoint, or undefined if the interval has not passed
 */
export const fetchIfAllowed = async (
  endpoint: string,
  interval: number,
): Promise<Response | undefined> => {
  const latestFetchLog = await getLatestFetchLog(endpoint);
  const lastFetchTime = latestFetchLog ? latestFetchLog.timestamp.getTime() : 0;
  if (Date.now() - lastFetchTime > interval) {
    const res = await fetch(endpoint, { headers: [['ACCEPT-ENCODING', 'gzip']] });
    await createFetchLog(endpoint, res.status);
    return res;
  } else {
    return;
  }
};
