import { randomBytes } from 'crypto';
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
      return sendJson(res, 400, { error: 'No Withings credentials stored' });
    }

    const scopes = credentials.scopes?.length ? credentials.scopes.join(',') : 'user.info,user.metrics,user.activity,user.sleepevents';
    const state = randomBytes(16).toString('hex');

    const authUrl = new URL('https://account.withings.com/oauth2_user/authorize2');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', credentials.client_id);
    authUrl.searchParams.set('redirect_uri', credentials.redirect_uri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    return sendJson(res, 200, { authUrl: authUrl.toString(), state });
  } catch (error) {
    console.error('Failed to initiate Withings OAuth', error);
    return sendJson(res, 500, { error: 'Internal server error' });
  }
}
