import type { Problem } from '@prisma/client';

import { prisma } from '~/db.server';
import { getLatestFetchLog, createFetchLog } from '~/models/fetchLog.server';

export type { Problem } from '@prisma/client';

export const PROBLEM_UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // one week in milliseconds
export const ENDPOINT = 'https://kenkoooo.com/atcoder/resources/merged-problems.json';

export const fetchProblemsIfAllowed = async () => {
  const latestFetchLog = await getLatestFetchLog(ENDPOINT);
  const interval = Date.now() - latestFetchLog.timestamp.getTime();
  if (interval > PROBLEM_UPDATE_INTERVAL) {
    const res = await fetch(ENDPOINT, { headers: [['ACCEPT-ENCODING', 'gzip']] });
    await createFetchLog(ENDPOINT, res.status);
    return res;
  } else {
    return;
  }
};

type problemDatum = {
  id: string;
  contest_id: string;
  problem_index: string;
  name: string;
  title: string;
  shortest_submission_id: number;
  shortest_contest_id: string;
  shortest_user_id: string;
  fastest_submission_id: number;
  fastest_contest_id: string;
  fastest_user_id: string;
  first_submission_id: number;
  first_contest_id: string;
  first_user_id: string;
  source_code_length: number;
  execution_time: number;
  point: number;
  solver_count: number;
};

export const updateProblemsIfAllowed = async () => {
  const res = await fetchProblemsIfAllowed();
  if (res) {
    const data: problemDatum[] = await res.json();
    await prisma.problem.deleteMany();
    for (const datum of data) {
      await prisma.problem.create({
        data: {
          id: datum.id,
          title: datum.title,
          difficulty: datum.point,
        },
      });
    }
  }
};

export const queryAllProblemsByDifficulty = async (difficulty: number) => {
  await updateProblemsIfAllowed();
  return await prisma.problem.findMany({
    where: {
      difficulty,
    },
  });
};

/**
 * fetch all problems and choose one from them randomlu
 * @param difficulty: 100, 200, 300, 400, 500, 600
 */
export const queryRandomProblemByDifficulty = async (difficulty: number) => {
  const problems = await queryAllProblemsByDifficulty(difficulty);
  const index = Math.floor(Math.random() * problems.length);
  return problems[index];
};
