import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readSetting, upsertWithingsTokens } from '../../_utils/pocketbase';
import type { WithingsCredentials } from '../../../src/types';

const CREDENTIALS_KEY = 'withings_credentials';

function sendJson(res: VercelResponse, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

async function exchangeCodeForToken(credentials: WithingsCredentials, code: string) {
  const body = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'authorization_code',
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    code,
    redirect_uri: credentials.redirect_uri,
  });

  const response = await fetch('https://wbsapi.withings.net/v2/oauth2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Withings token request failed with status ${response.status}`);
  }

  const data = await response.json() as { status: number; error?: string; body: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    userid: string;
  } };

  if (data.status !== 0) {
    throw new Error(`Withings API error: ${data.error}`);
  }

  return data.body;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    let body: Record<string, unknown> | undefined = req.body as Record<string, unknown> | undefined;
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body) as Record<string, unknown>;
      } catch (parseError) {
        console.error('Failed to parse callback payload', parseError);
        return sendJson(res, 400, { error: 'Invalid JSON payload' });
      }
    }
    const code = body && typeof body['code'] === 'string' ? (body['code'] as string) : undefined;
    const userId = body && typeof body['userId'] === 'string' ? (body['userId'] as string) : undefined;

    if (!code || !userId) {
      return sendJson(res, 400, { error: 'Missing code or userId' });
    }

    const credentials = await readSetting<WithingsCredentials>(CREDENTIALS_KEY);
    if (!credentials) {
      return sendJson(res, 500, { error: 'Withings credentials not configured' });
    }

    const tokenData = await exchangeCodeForToken(credentials, code);

    const expires_at = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    await upsertWithingsTokens(userId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at,
    });

    return sendJson(res, 200, { success: true, userid: tokenData.userid, expires_at });
  } catch (error) {
    console.error('Withings OAuth callback failed', error);
    return sendJson(res, 500, { error: (error as Error).message || 'Internal server error' });
  }
}
