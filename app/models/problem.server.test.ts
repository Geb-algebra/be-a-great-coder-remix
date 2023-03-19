import { type SpyInstance } from 'vitest';
import { prisma } from '~/db.server';

import {
  PROBLEM_UPDATE_INTERVAL,
  ENDPOINT,
  fetchProblemsIfAllowed,
  updateProblemsIfAllowed,
  queryAllProblemsByDifficulty,
} from '~/models/problem.server';
import { createFetchLog, getLatestFetchLog } from './fetchLog.server';

describe('fetchProblemsIfAllowed', () => {
  let mockedFetch: SpyInstance;
  beforeAll(async () => {
    await prisma.atCoderAPIFetchLog.deleteMany();
  });
  afterEach(async () => {
    await prisma.atCoderAPIFetchLog.deleteMany();
  });
  beforeEach(async () => {
    mockedFetch = vi
      .spyOn(global, 'fetch')
      .mockImplementation(async () => new Response('{}', { status: 200 }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it.each([
    PROBLEM_UPDATE_INTERVAL,
    PROBLEM_UPDATE_INTERVAL * 1.00001,
    PROBLEM_UPDATE_INTERVAL * 10,
  ])('should update when the specified interval elapsed', async (elapsed) => {
    const lastFetchedTime = new Date(Date.now() - elapsed);
    await createFetchLog(ENDPOINT, 200, lastFetchedTime);
    const now = new Date();
    await fetchProblemsIfAllowed();
    expect(mockedFetch).toHaveBeenCalled();
    const lastFetchLog = await getLatestFetchLog(ENDPOINT);
    expect((lastFetchLog?.timestamp.getTime() as number) / 1000).toBeCloseTo(
      now.getTime() / 1000,
      1,
    );
  });
  it.each([PROBLEM_UPDATE_INTERVAL * 0.9999999, PROBLEM_UPDATE_INTERVAL * 0.1])(
    'should not update when the specified interval doesnt elapsed',
    async (elapsed) => {
      const lastFetchedTime = new Date(Date.now() - elapsed);
      await createFetchLog(ENDPOINT, 200, lastFetchedTime);
      const res = await fetchProblemsIfAllowed();
      expect(res).toBeUndefined();
    },
  );
});

describe('updateProblemsIfAllowed', () => {
  let mockedFetch: SpyInstance;
  beforeEach(async () => {
    await prisma.atCoderAPIFetchLog.deleteMany();
    await prisma.problem.deleteMany();
    mockedFetch = vi.spyOn(global, 'fetch').mockImplementation(
      async () =>
        new Response(
          JSON.stringify([
            {
              id: 'abc158_d',
              contest_id: 'abc158',
              problem_index: 'D',
              name: 'String Formation',
              title: 'D. String Formation',
              shortest_submission_id: 21374338,
              shortest_contest_id: 'abc158',
              shortest_user_id: 'Fleur',
              fastest_submission_id: 10718722,
              fastest_contest_id: 'abc158',
              fastest_user_id: 'uzzy',
              first_submission_id: 10590545,
              first_contest_id: 'abc158',
              first_user_id: 'kort0n',
              source_code_length: 60,
              execution_time: 2,
              point: 400,
              solver_count: 11009,
            },
            {
              id: 'abc160_b',
              contest_id: 'abc160',
              problem_index: 'B',
              name: 'Golden Coins',
              title: 'B. Golden Coins',
              shortest_submission_id: 15256756,
              shortest_contest_id: 'abc160',
              shortest_user_id: 'Kude',
              fastest_submission_id: 11269061,
              fastest_contest_id: 'abc160',
              fastest_user_id: 'kotatsugame',
              first_submission_id: 11264470,
              first_contest_id: 'abc160',
              first_user_id: 'shun0923',
              source_code_length: 13,
              execution_time: 0,
              point: 200,
              solver_count: 19460,
            },
          ]),
          { status: 200 },
        ),
    );
    await prisma.problem.create({ data: { id: 'xxxyyy', title: 'old problem', difficulty: 200 } });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.atCoderAPIFetchLog.deleteMany();
    await prisma.problem.deleteMany();
  });
  it('should update all problems if allowed', async () => {
    const lastFetchedTime = new Date(Date.now() - PROBLEM_UPDATE_INTERVAL);
    await createFetchLog(ENDPOINT, 200, lastFetchedTime);
    const oldProbs = await prisma.problem.findMany();
    expect(oldProbs).toHaveLength(1);
    expect(oldProbs[0].title).toEqual('old problem');
    await updateProblemsIfAllowed();
    const newProbs = await prisma.problem.findMany();
    expect(newProbs).toHaveLength(2);
    expect(new Set([newProbs[0].title, newProbs[1].title])).toEqual(
      new Set(['D. String Formation', 'B. Golden Coins']),
    );
  });
  it('should not update any problems if not allowed', async () => {
    const lastFetchedTime = new Date(Date.now() - PROBLEM_UPDATE_INTERVAL * 0.9);
    await createFetchLog(ENDPOINT, 200, lastFetchedTime);
    const oldProbs = await prisma.problem.findMany();
    expect(oldProbs).toHaveLength(1);
    expect(oldProbs[0].title).toEqual('old problem');
    await updateProblemsIfAllowed();
    const newProbs = await prisma.problem.findMany();
    expect(newProbs).toHaveLength(1);
    expect(newProbs[0].title).toEqual('old problem');
  });
});

describe('queryAllProblemsByDifficulty', () => {
  let mockedFetch: SpyInstance;
  beforeAll(async () => {
    await prisma.atCoderAPIFetchLog.deleteMany();
    await prisma.problem.deleteMany();
  });
  afterEach(async () => {
    await prisma.atCoderAPIFetchLog.deleteMany();
    await prisma.problem.deleteMany();
  });
  beforeEach(async () => {
    for (const data of [
      { id: '200_1', title: 'problem', difficulty: 200 },
      { id: '200_2', title: 'problem', difficulty: 200 },
      { id: '300_1', title: 'problem', difficulty: 300 },
    ]) {
      await prisma.problem.create({ data });
    }
  });
  it('should fetch two problems with difficulty 200', async () => {
    await createFetchLog(ENDPOINT, 200);
    await updateProblemsIfAllowed();
    const probs = await queryAllProblemsByDifficulty(200);
    expect(probs).toHaveLength(2);
    for (const p of probs) {
      expect(p.difficulty).toEqual(200);
    }
  });
});
