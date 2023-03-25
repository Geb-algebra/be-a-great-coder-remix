import { prisma } from '~/db.server';

import { createFetchLog, getLatestFetchLog } from '~/models/fetchLog.server';

beforeAll(async () => {
  await prisma.atCoderAPIFetchLog.deleteMany();
});
afterEach(async () => {
  await prisma.atCoderAPIFetchLog.deleteMany();
});

describe('createFetchLog', () => {
  it('should create a right record', async () => {
    const endpoint = 'https://example.com';
    const status = 401;
    const now = Date.now();
    await createFetchLog(endpoint, status);
    const created = await prisma.atCoderAPIFetchLog.findFirst();
    expect(created?.endpoint).toEqual(endpoint);
    expect(created?.status).toEqual(status);
    expect((created?.timestamp.getTime() as number) / 10000).toBeCloseTo(now / 10000, 1);
  });
  it('should set status 200 by default', async () => {
    const endpoint = 'https://example.com';
    const now = new Date();
    await createFetchLog(endpoint);
    const created = await prisma.atCoderAPIFetchLog.findFirst();
    expect(created?.endpoint).toEqual(endpoint);
    expect(created?.status).toEqual(200);
    expect((created?.timestamp.getTime() as number) / 10000).toBeCloseTo(now.getTime() / 10000, 1);
  });
});

describe('fetchLatest', async () => {
  it('should get the latest record', async () => {
    await createFetchLog('https://example.com/1');
    await createFetchLog('https://example.com/2');
    await createFetchLog('https://example.com/1');
    await createFetchLog('https://example.com/2');
    const latest = await createFetchLog('https://example.com/1');
    const latest2 = await createFetchLog('https://example.com/2');

    const fetchedLatest = await getLatestFetchLog('https://example.com/1');
    expect(fetchedLatest.id).toEqual(latest.id);
    const fetchedLatest2 = await getLatestFetchLog('https://example.com/2');
    expect(fetchedLatest2.id).toEqual(latest2.id);
  });
  it('should get logs with specified status only', async () => {
    await createFetchLog('https://example.com/1', 200);
    const right = await createFetchLog('https://example.com/1', 200);
    await createFetchLog('https://example.com/1', 201);
    await createFetchLog('https://example.com/1', 500);

    const fetchedLatest = await getLatestFetchLog('https://example.com/1');
    expect(fetchedLatest.id).toEqual(right.id);
  });
});
