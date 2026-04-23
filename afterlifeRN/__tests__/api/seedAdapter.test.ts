import * as fs from 'fs';
import * as path from 'path';
import { SEED } from '../../src/mocks/seedIndex';
import {
  toApiClone,
  toApiFeed,
  toApiMessage,
  toApiCloneListItem,
} from '../../src/api/seedAdapter';
import { apiClient } from '../../src/api/client';

const CONTRACTS_DIR = path.resolve(__dirname, '../../../docs/contracts');

function loadSnapshot(name: string): any {
  const raw = fs.readFileSync(path.join(CONTRACTS_DIR, name), 'utf-8');
  return JSON.parse(raw);
}

function publicKeys(obj: Record<string, any>): string[] {
  return Object.keys(obj).filter((k) => !k.startsWith('_')).sort();
}

function assertSameShape(actual: any, expected: any, label: string) {
  if (expected === null || typeof expected !== 'object') return;
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      throw new Error(`${label}: expected array, got ${typeof actual}`);
    }
    if (expected.length > 0 && actual.length > 0) {
      assertSameShape(actual[0], expected[0], `${label}[0]`);
    }
    return;
  }
  const expectedKeys = publicKeys(expected);
  const actualKeys = Object.keys(actual ?? {}).sort();
  const missing = expectedKeys.filter((k) => !actualKeys.includes(k));
  const extra = actualKeys.filter((k) => !expectedKeys.includes(k));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `${label}: shape diff\n  missing: ${missing.join(', ')}\n  extra: ${extra.join(', ')}`,
    );
  }
  for (const k of expectedKeys) {
    assertSameShape(actual[k], expected[k], `${label}.${k}`);
  }
}

describe('seedAdapter shape diff vs docs/contracts', () => {
  it('ApiClone matches clone.snapshot.json#clone', () => {
    const snap = loadSnapshot('clone.snapshot.json');
    const clone = SEED.clones[0];
    const apiClone = toApiClone(clone, SEED, clone.ownerId);
    assertSameShape(apiClone, snap.clone, 'ApiClone');
  });

  it('ApiCloneListItem matches clone-list.snapshot.json#items[0]', () => {
    const snap = loadSnapshot('clone-list.snapshot.json');
    const clone = SEED.clones[0];
    const item = toApiCloneListItem(clone, SEED);
    assertSameShape(item, snap.items[0], 'ApiCloneListItem');
  });

  it('ApiFeed matches feed-list.snapshot.json#items[0]', () => {
    const snap = loadSnapshot('feed-list.snapshot.json');
    const feed = SEED.feeds[0];
    const clone = SEED.clones.find((c) => c.id === feed.cloneId)!;
    const apiFeed = toApiFeed(feed, clone);
    assertSameShape(apiFeed, snap.items[0], 'ApiFeed');
  });

  it('ApiMessage matches message-thread.snapshot.json#items[0]', () => {
    const snap = loadSnapshot('message-thread.snapshot.json');
    const msg = SEED.messages[0];
    const apiMsg = toApiMessage(msg, 'sess-test');
    assertSameShape(apiMsg, snap.items[0], 'ApiMessage');
  });

  it('listFeeds response matches feed-list.snapshot.json root', async () => {
    const snap = loadSnapshot('feed-list.snapshot.json');
    const clone = SEED.clones[0];
    const res = await apiClient.listFeeds(clone.id, { limit: 2 });
    assertSameShape(res, snap, 'listFeeds');
  });

  it('listMessages response matches message-thread.snapshot.json root', async () => {
    const snap = loadSnapshot('message-thread.snapshot.json');
    const anyMsg = SEED.messages[0];
    const res = await apiClient.listMessages(anyMsg.cloneId, anyMsg.userId, { limit: 2 });
    assertSameShape(res, snap, 'listMessages');
  });

  it('listFollowedClones response matches followed-clones.snapshot.json', async () => {
    const snap = loadSnapshot('followed-clones.snapshot.json');
    const res = await apiClient.listFollowedClones(1);
    assertSameShape(res, snap, 'listFollowedClones');
  });

  it('getSession response matches sessions.snapshot.json#_response_200', async () => {
    const snap = loadSnapshot('sessions.snapshot.json');
    const clone = SEED.clones[0];
    const res = await apiClient.getSession(clone.id, clone.ownerId);
    assertSameShape(res, snap._response_200, 'getSession');
  });

  it('getClone response matches clone.snapshot.json root', async () => {
    const snap = loadSnapshot('clone.snapshot.json');
    const clone = SEED.clones[0];
    const res = await apiClient.getClone(clone.id, { viewerId: clone.ownerId });
    assertSameShape(res, snap, 'getClone');
  });
});
