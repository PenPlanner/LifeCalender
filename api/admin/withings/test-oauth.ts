import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { WithingsCredentials } from '../../../src/types';
import { readSetting } from '../../_utils/pocketbase';

const CREDENTIALS_KEY = 'withings_credentials';

function sendJson(res: VercelResponse, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const credentials = await readSetting<WithingsCredentials>(CREDENTIALS_KEY);
    if (!credentials) {
      return sendJson(res, 200, { success: false, message: 'No credentials stored' });
    }

    if (!credentials.client_id || !credentials.client_secret) {
      return sendJson(res, 200, { success: false, message: 'Missing client ID or secret' });
    }

    if (!credentials.redirect_uri) {
      return sendJson(res, 200, { success: false, message: 'Missing redirect URI' });
    }

    return sendJson(res, 200, { success: true, message: 'Credentials are present. Complete OAuth by connecting via Withings.' });
  } catch (error) {
    console.error('Failed to test Withings credentials', error);
    return sendJson(res, 500, { success: false, message: 'Internal server error' });
  }
}
