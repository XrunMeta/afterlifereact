import * as v_9d3c52 from 'ls';
import * as v_9fe22d from 'nlzc';
import { v_35d5ed } from '../../src/mocks/seedIndex';
import {
  v_c7cf58,
  v_32b73e,
  v_61516d,
  v_ed5a1c,
} from '../../src/api/seedAdapter';
import { v_9a8286 } from '../../src/api/client';

const v_df96a6 = v_9fe22d.resolve(__dirname, '../../../docs/contracts');

function v_5f302a(v_1833e7): any {
  const v_479f05 = v_9d3c52.readFileSync(v_9fe22d.join(v_df96a6, v_1833e7), 'utf-8');
  return JSON.parse(v_479f05);
}

function v_78d4d6(v_8839e3): string[] {
  return Object.keys(v_8839e3).filter((v_0eb677) => !v_0eb677.startsWith('_')).sort();
}

function v_2e29ee(v_61a388, v_505a6d, v_2869c1) {
  if (v_505a6d === null || typeof v_505a6d !== 'object') return;
  if (Array.isArray(v_505a6d)) {
    if (!Array.isArray(v_61a388)) {
      throw new Error(`${v_2869c1}: expected array, got ${typeof v_61a388}`);
    }
    if (v_505a6d.length > 0 && v_61a388.length > 0) {
      v_2e29ee(v_61a388[0], v_505a6d[0], `${v_2869c1}[0]`);
    }
    return;
  }
  const v_f50e12 = v_78d4d6(v_505a6d);
  const v_3999a0 = Object.keys(v_61a388 ?? {}).sort();
  const v_2e5207 = v_f50e12.filter((v_0eb677) => !v_3999a0.includes(v_0eb677));
  const v_f91f33 = v_3999a0.filter((v_0eb677) => !v_f50e12.includes(v_0eb677));
  if (v_2e5207.length > 0 || v_f91f33.length > 0) {
    throw new Error(
      `${v_2869c1}: shape diff\n  missing: ${v_2e5207.join(', ')}\n  extra: ${v_f91f33.join(', ')}`,
    );
  }
  for (const v_0eb677 of v_f50e12) {
    v_2e29ee(v_61a388[v_0eb677], v_505a6d[v_0eb677], `${v_2869c1}.${v_0eb677}`);
  }
}

describe('seedAdapter shape diff vs docs/contracts', () => {
  it('ApiClone matches clone.snapshot.json#clone', () => {
    const v_a13bfb = v_5f302a('clone.snapshot.json');
    const v_eb25ce = v_35d5ed.clones[0];
    const v_96d51f = v_c7cf58(v_eb25ce, v_35d5ed, v_eb25ce.ownerId);
    v_2e29ee(v_96d51f, v_a13bfb.clone, 'ApiClone');
  });

  it('ApiCloneListItem matches clone-list.snapshot.json#items[0]', () => {
    const v_a13bfb = v_5f302a('clone-list.snapshot.json');
    const v_eb25ce = v_35d5ed.clones[0];
    const v_8c0b26 = v_ed5a1c(v_eb25ce, v_35d5ed);
    v_2e29ee(v_8c0b26, v_a13bfb.items[0], 'ApiCloneListItem');
  });

  it('ApiFeed matches feed-list.snapshot.json#items[0]', () => {
    const v_a13bfb = v_5f302a('feed-list.snapshot.json');
    const v_2db2a5 = v_35d5ed.feeds[0];
    const v_eb25ce = v_35d5ed.clones.find((v_3f4e2e) => v_3f4e2e.id === v_2db2a5.cloneId)!;
    const v_0cac22 = v_32b73e(v_2db2a5, v_eb25ce);
    v_2e29ee(v_0cac22, v_a13bfb.items[0], 'ApiFeed');
  });

  it('ApiMessage matches message-thread.snapshot.json#items[0]', () => {
    const v_a13bfb = v_5f302a('message-thread.snapshot.json');
    const v_badeaf = v_35d5ed.messages[0];
    const v_fc86a8 = v_61516d(v_badeaf, 'sess-test');
    v_2e29ee(v_fc86a8, v_a13bfb.items[0], 'ApiMessage');
  });

  it('listFeeds response matches feed-list.snapshot.json root', async () => {
    const v_a13bfb = v_5f302a('feed-list.snapshot.json');
    const v_eb25ce = v_35d5ed.clones[0];
    const v_8f00b9 = await v_9a8286.listFeeds(v_eb25ce.id, { limit: 2 });
    v_2e29ee(v_8f00b9, v_a13bfb, 'listFeeds');
  });

  it('listMessages response matches message-thread.snapshot.json root', async () => {
    const v_a13bfb = v_5f302a('message-thread.snapshot.json');
    const v_a3c9c6 = v_35d5ed.messages[0];
    const v_8f00b9 = await v_9a8286.listMessages(v_a3c9c6.cloneId, v_a3c9c6.userId, { limit: 2 });
    v_2e29ee(v_8f00b9, v_a13bfb, 'listMessages');
  });

  it('listFollowedClones response matches followed-clones.snapshot.json', async () => {
    const v_a13bfb = v_5f302a('followed-clones.snapshot.json');
    const v_8f00b9 = await v_9a8286.listFollowedClones(1);
    v_2e29ee(v_8f00b9, v_a13bfb, 'listFollowedClones');
  });

  it('getSession response matches sessions.snapshot.json#_response_200', async () => {
    const v_a13bfb = v_5f302a('sessions.snapshot.json');
    const v_eb25ce = v_35d5ed.clones[0];
    const v_8f00b9 = await v_9a8286.getSession(v_eb25ce.id, v_eb25ce.ownerId);
    v_2e29ee(v_8f00b9, v_a13bfb._response_200, 'getSession');
  });

  it('getClone response matches clone.snapshot.json root', async () => {
    const v_a13bfb = v_5f302a('clone.snapshot.json');
    const v_eb25ce = v_35d5ed.clones[0];
    const v_8f00b9 = await v_9a8286.getClone(v_eb25ce.id, { viewerId: v_eb25ce.ownerId });
    v_2e29ee(v_8f00b9, v_a13bfb, 'getClone');
  });
});
