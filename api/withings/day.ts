import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getValidAccessToken,
  getDailyActivity,
  getMeasurements,
  getSleep,
  getWorkouts,
  mapMeasurementType,
  getWorkoutCategoryName,
} from '../_utils/withingsServer';

function sendJson(res: VercelResponse, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

function parseDate(value: string | undefined) {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error('Invalid date parameter');
  }
  return parsed;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const dateParam = typeof req.query.date === 'string' ? req.query.date : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'user1';
    const date = parseDate(dateParam);

    const tokens = await getValidAccessToken(userId);
    const accessToken = tokens.access_token;

    const [activity, rawMeasurements, sleep, workouts] = await Promise.all([
      getDailyActivity(accessToken, date),
      getMeasurements(accessToken, date),
      getSleep(accessToken, date),
      getWorkouts(accessToken, date),
    ]);

    const measurements: Record<string, number> = {};
    Object.entries(rawMeasurements).forEach(([type, value]) => {
      const label = mapMeasurementType(Number(type));
      measurements[label] = value as number;
    });

    const normalizedWorkouts = workouts
      .filter(item => (item.enddate - item.startdate) / 60 >= 3)
      .map(item => {
        const durationMinutes = Math.round((item.enddate - item.startdate) / 60);
        return {
          id: item.id,
          category: getWorkoutCategoryName(item.category),
          startdate: item.startdate,
          enddate: item.enddate,
          duration: durationMinutes,
          calories: Math.round(item.data?.calories ?? 0),
          distance: Math.round((item.data?.distance ?? 0) / 1000 * 100) / 100,
          steps: item.data?.steps ?? 0,
        };
      });

    return sendJson(res, 200, {
      measurements,
      activity,
      sleep,
      workouts: normalizedWorkouts,
    });
  } catch (error) {
    console.error('Failed to fetch Withings day data', error);
    return sendJson(res, 500, { error: (error as Error).message || 'Internal server error' });
  }
}
