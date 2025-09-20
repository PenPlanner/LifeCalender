import { readSetting, readWithingsTokens, upsertWithingsTokens } from './pocketbase';
import type { WithingsCredentials } from '../../src/types';
import { WITHINGS_MEASUREMENT_TYPES } from './withingsConstants';

const CREDENTIALS_KEY = 'withings_credentials';

interface WithingsTokens {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

type WithingsApiResponse<T> = {
  status: number;
  body: T;
  error?: string;
};

async function fetchJson<T>(url: string, params: URLSearchParams): Promise<T> {
  const fullUrl = `${url}?${params.toString()}`;
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'LifeCalendar/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Withings request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as WithingsApiResponse<T>;
  if (data.status !== 0) {
    throw new Error(`Withings API error: ${data.error}`);
  }

  return data.body as T;
}

async function refreshAccessToken(tokens: WithingsTokens, credentials: WithingsCredentials) {
  const body = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'refresh_token',
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: tokens.refresh_token,
  });

  const response = await fetch('https://wbsapi.withings.net/v2/oauth2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Withings refresh failed with status ${response.status}`);
  }

  const data = await response.json() as WithingsApiResponse<{ access_token: string; refresh_token: string; expires_in: number; userid: string }>;
  if (data.status !== 0) {
    throw new Error(`Withings refresh error: ${data.error}`);
  }

  const updated = data.body;
  const expires_at = new Date(Date.now() + updated.expires_in * 1000).toISOString();

  await upsertWithingsTokens(tokens.user_id, {
    access_token: updated.access_token,
    refresh_token: updated.refresh_token,
    expires_at,
  });

  return {
    ...tokens,
    access_token: updated.access_token,
    refresh_token: updated.refresh_token,
    expires_at,
  };
}

export async function getValidAccessToken(userId: string) {
  const credentials = await readSetting<WithingsCredentials>(CREDENTIALS_KEY);
  if (!credentials) {
    throw new Error('Withings credentials not configured');
  }

  const tokens = await readWithingsTokens(userId);
  if (!tokens) {
    throw new Error('No Withings tokens stored for user');
  }

  const expiresAt = new Date(tokens.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now() + 60 * 1000) {
    return refreshAccessToken(tokens as WithingsTokens, credentials);
  }

  return tokens as WithingsTokens;
}

export async function getDailyActivity(accessToken: string, date: Date) {
  const params = new URLSearchParams({
    action: 'getactivity',
    access_token: accessToken,
    startdateymd: date.toISOString().split('T')[0],
    enddateymd: date.toISOString().split('T')[0],
  });

  type ActivityResponse = { activities: Array<{ steps: number; distance: number; calories: number; moderate: number; intense: number }> };
  const body = await fetchJson<ActivityResponse>('https://wbsapi.withings.net/measure', params);
  return body.activities?.[0] ?? null;
}

export async function getMeasurements(accessToken: string, date: Date) {
  const params = new URLSearchParams({
    action: 'getmeas',
    access_token: accessToken,
    meastype: [
      WITHINGS_MEASUREMENT_TYPES.WEIGHT,
      WITHINGS_MEASUREMENT_TYPES.FAT_MASS_WEIGHT,
      WITHINGS_MEASUREMENT_TYPES.MUSCLE_MASS,
      WITHINGS_MEASUREMENT_TYPES.HEART_PULSE,
      WITHINGS_MEASUREMENT_TYPES.SYSTOLIC_BLOOD_PRESSURE,
      WITHINGS_MEASUREMENT_TYPES.DIASTOLIC_BLOOD_PRESSURE,
      WITHINGS_MEASUREMENT_TYPES.VO2_MAX,
    ].join(','),
    startdate: Math.floor(date.getTime() / 1000 - 24 * 60 * 60).toString(),
    enddate: Math.floor(date.getTime() / 1000 + 24 * 60 * 60).toString(),
  });

  type MeasureGroup = { date: number; measures: Array<{ value: number; unit: number; type: number }> };
  type MeasureResponse = { measuregrps: MeasureGroup[] };

  const body = await fetchJson<MeasureResponse>('https://wbsapi.withings.net/measure', params);

  const result: Record<number, number> = {};
  for (const group of body.measuregrps ?? []) {
    for (const measure of group.measures ?? []) {
      const value = measure.value * Math.pow(10, measure.unit);
      result[measure.type] = value;
    }
  }
  return result;
}

export async function getSleep(accessToken: string, date: Date) {
  const params = new URLSearchParams({
    action: 'getsleep',
    access_token: accessToken,
    startdate: Math.floor(date.getTime() / 1000 - 12 * 60 * 60).toString(),
    enddate: Math.floor(date.getTime() / 1000 + 12 * 60 * 60).toString(),
  });

  type SleepSeries = Array<{ data: Record<string, number> }>;
  type SleepResponse = { series: SleepSeries };

  try {
    const body = await fetchJson<SleepResponse>('https://wbsapi.withings.net/sleep', params);
    return body.series?.[0] ?? null;
  } catch (error) {
    console.warn('Withings sleep request failed', error);
    return null;
  }
}

export async function getWorkouts(accessToken: string, date: Date) {
  const params = new URLSearchParams({
    action: 'getworkouts',
    access_token: accessToken,
    startdateymd: date.toISOString().split('T')[0],
    enddateymd: date.toISOString().split('T')[0],
  });

  type Workout = {
    id: string;
    category: number;
    startdate: number;
    enddate: number;
    data?: {
      calories?: number;
      distance?: number;
      steps?: number;
    };
  };

  type WorkoutResponse = { series?: Workout[] };

  const body = await fetchJson<WorkoutResponse>('https://wbsapi.withings.net/measure', params);
  return body.series ?? [];
}

const WORKOUT_CATEGORY_MAP: Record<number, string> = {
  1: 'Promenad',
  2: 'Löpning',
  3: 'Simning',
  8: 'Tennis',
  16: 'Styrketräning',
  17: 'Cykling',
  18: 'Elliptical',
  19: 'Rodd',
  20: 'Skidor',
  21: 'Alpint',
  22: 'Snowboard',
  23: 'Skridskor',
  24: 'Multisport',
  25: 'Yoga',
  26: 'Pilates',
  27: 'Dans',
  36: 'Annan träning',
  187: 'Muskelträning',
  188: 'Konditionsträning',
};

export function getWorkoutCategoryName(category: number) {
  return WORKOUT_CATEGORY_MAP[category] ?? 'Träning';
}

export function mapMeasurementType(type: number) {
  const map: Record<number, string> = {
    [WITHINGS_MEASUREMENT_TYPES.WEIGHT]: 'Weight',
    [WITHINGS_MEASUREMENT_TYPES.FAT_MASS_WEIGHT]: 'Fat Mass',
    [WITHINGS_MEASUREMENT_TYPES.MUSCLE_MASS]: 'Muscle Mass',
    [WITHINGS_MEASUREMENT_TYPES.HEART_PULSE]: 'Heart Rate',
    [WITHINGS_MEASUREMENT_TYPES.SYSTOLIC_BLOOD_PRESSURE]: 'Systolic BP',
    [WITHINGS_MEASUREMENT_TYPES.DIASTOLIC_BLOOD_PRESSURE]: 'Diastolic BP',
    [WITHINGS_MEASUREMENT_TYPES.VO2_MAX]: 'VO2 Max',
  };

  return map[type] ?? `Unknown (${type})`;
}
