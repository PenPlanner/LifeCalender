import PocketBase, { type ClientResponseError } from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const POCKETBASE_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const POCKETBASE_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
const POCKETBASE_ADMIN_TOKEN = process.env.POCKETBASE_ADMIN_TOKEN;

if (!POCKETBASE_URL) {
  throw new Error('Missing POCKETBASE_URL environment variable');
}

async function ensureAdminAuth(pb: PocketBase) {
  if (POCKETBASE_ADMIN_TOKEN) {
    pb.authStore.save(POCKETBASE_ADMIN_TOKEN, null);
    return;
  }

  if (!POCKETBASE_ADMIN_EMAIL || !POCKETBASE_ADMIN_PASSWORD) {
    throw new Error('Missing PocketBase admin credentials (POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD)');
  }

  if (!pb.authStore.isValid) {
    await pb.admins.authWithPassword(POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD);
  }
}

export async function getPocketBaseClient() {
  const pb = new PocketBase(POCKETBASE_URL);
  await ensureAdminAuth(pb);
  return pb;
}

function isNotFoundError(error: unknown): error is ClientResponseError {
  return typeof error === 'object' && error !== null && 'status' in error && (error as ClientResponseError).status === 404;
}

export async function upsertSetting(key: string, value: unknown) {
  const pb = await getPocketBaseClient();
  const collection = pb.collection('settings');
  const stringifiedValue = JSON.stringify(value);

  try {
    const record = await collection.getFirstListItem(`key="${key}"`);
    await collection.update(record.id, { value: stringifiedValue });
    return { id: record.id, key, value };
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      const record = await collection.create({ key, value: stringifiedValue });
      return { id: record.id, key, value };
    }
    throw error;
  }
}

export async function readSetting<T = unknown>(key: string): Promise<T | null> {
  const pb = await getPocketBaseClient();
  const collection = pb.collection('settings');

  try {
    const record = await collection.getFirstListItem(`key="${key}"`);
    return JSON.parse(record.value) as T;
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export async function upsertWithingsTokens(userId: string, data: {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}) {
  const pb = await getPocketBaseClient();
  const collection = pb.collection('withings_tokens');

  try {
    const record: any = await collection.getFirstListItem(`user_id="${userId}"`);
    await collection.update(record.id, data);
    return {
      id: record.id,
      user_id: userId,
      ...data,
    };
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      const record: any = await collection.create({ user_id: userId, ...data });
      return {
        id: record.id,
        user_id: userId,
        ...data,
      };
    }
    throw error;
  }
}

export async function readWithingsTokens(userId: string) {
  const pb = await getPocketBaseClient();
  const collection = pb.collection('withings_tokens');

  try {
    const record: any = await collection.getFirstListItem(`user_id="${userId}"`);
    return {
      id: record.id,
      user_id: record.user_id,
      access_token: record.access_token,
      refresh_token: record.refresh_token,
      expires_at: record.expires_at,
    };
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}
