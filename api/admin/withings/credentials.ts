import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { WithingsCredentials } from '../../../src/types';
import { readSetting, upsertSetting } from '../../_utils/pocketbase';

const CREDENTIALS_KEY = 'withings_credentials';

function sendJson(res: VercelResponse, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

function maskSecret(value: string | undefined): string | undefined {
  if (!value) return value;
  if (value.length <= 6) return '*'.repeat(value.length);
  return `${value.slice(0, 3)}${'*'.repeat(value.length - 6)}${value.slice(-3)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const credentials = await readSetting<WithingsCredentials>(CREDENTIALS_KEY);
      if (!credentials) {
        return sendJson(res, 200, null);
      }

      return sendJson(res, 200, {
        ...credentials,
        client_secret_masked: maskSecret(credentials.client_secret),
        isConnected: ((credentials as unknown as Record<string, unknown>).isConnected === true),
      });
    }

    if (req.method === 'POST') {
      let incoming: WithingsCredentials | undefined;
      try {
        incoming = typeof req.body === 'string' ? (JSON.parse(req.body) as WithingsCredentials) : (req.body as WithingsCredentials | undefined);
      } catch (parseError) {
        console.error('Failed to parse Withings credentials payload', parseError);
        return sendJson(res, 400, { error: 'Invalid JSON payload' });
      }

      if (!incoming?.client_id || !incoming.client_secret || !incoming.redirect_uri) {
        return sendJson(res, 400, { error: 'Missing required credential fields' });
      }

      await upsertSetting(CREDENTIALS_KEY, incoming);
      return sendJson(res, 200, { success: true });
    }

    res.setHeader('Allow', 'GET,POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('Failed to handle Withings credentials request', error);
    return sendJson(res, 500, { error: 'Internal server error' });
  }
}
