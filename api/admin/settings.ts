import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Settings } from '../../src/types';
import { DEFAULT_SETTINGS } from '../_utils/defaults';
import { readSetting, upsertSetting } from '../_utils/pocketbase';

const SETTINGS_KEY = 'app_settings';

function sendJson(res: VercelResponse, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const settings = (await readSetting<Settings>(SETTINGS_KEY)) ?? DEFAULT_SETTINGS;
      return sendJson(res, 200, settings);
    }

    if (req.method === 'POST') {
      let incoming: Settings | undefined;
      try {
        incoming = typeof req.body === 'string' ? (JSON.parse(req.body) as Settings) : (req.body as Settings | undefined);
      } catch (parseError) {
        console.error('Failed to parse settings payload', parseError);
        return sendJson(res, 400, { error: 'Invalid JSON payload' });
      }

      if (!incoming) {
        return sendJson(res, 400, { error: 'Missing settings payload' });
      }

      await upsertSetting(SETTINGS_KEY, incoming);
      return sendJson(res, 200, { success: true });
    }

    res.setHeader('Allow', 'GET,POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('Failed to handle settings request', error);
    return sendJson(res, 500, { error: 'Internal server error' });
  }
}
