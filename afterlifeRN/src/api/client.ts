import { v_35d5ed } from '../mocks/seedIndex';
import type { v_f4506d } from '../mocks/seedLoader';
import {
  v_c7cf58,
  v_ed5a1c,
  v_32b73e,
  v_61516d,
  v_6a944d,
  v_846893,
} from './seedAdapter';
import type {
  v_fe00c4,
  v_549f6a,
  v_77ace6,
  v_f6b1e7,
  v_6ac723,
  v_6dbe7c,
  v_ec2546,
  v_7d4414,
} from './types';
import type { v_924690 } from '../types/domain';
import { v_2d9aa2, v_bdea6c, v_d745f1 } from './shortsStore';

const v_b8fec2 = 20;
const v_c13be2 = 'sess-stub-local';

export interface ListParams {
  cursor?: number | null;
  limit?: number;
}

export interface GetCloneParams {
  viewerId: number | null;
}

export interface ListMessagesParams extends ListParams {
  sessionId?: string;
}

function v_119a79(): v_f4506d {
  return v_35d5ed;
}

export const v_9a8286 = {
  async getClone(v_6e0fd3, { viewerId: v_013af2 }: GetCloneParams): Promise<{ clone: v_fe00c4 }> {
    const v_bdb39e = v_119a79();
    const v_eb25ce = v_bdb39e.clones.find((v_3f4e2e) => v_3f4e2e.id === v_6e0fd3);
    if (!v_eb25ce) throw new Error(`Clone not found: ${v_6e0fd3}`);
    return { clone: v_c7cf58(v_eb25ce, v_bdb39e, v_013af2) };
  },

  async listFeeds(
    v_6e0fd3,
    { cursor: v_75cbf4, limit: v_02be30 = v_b8fec2 }: ListParams = {},
  ): Promise<v_77ace6> {
    const v_bdb39e = v_119a79();
    const v_eb25ce = v_bdb39e.clones.find((v_3f4e2e) => v_3f4e2e.id === v_6e0fd3);
    if (!v_eb25ce) throw new Error(`Clone not found: ${v_6e0fd3}`);
    const v_b16994 = v_bdb39e.feeds
      .filter((v_8b5cd8) => v_8b5cd8.cloneId === v_6e0fd3)
      .slice()
      .sort((v_779914, v_148ff6) => v_148ff6.id - v_779914.id);
    const v_fc4524 = v_75cbf4 == null ? 0 : v_b16994.findIndex((v_8b5cd8) => v_8b5cd8.id < v_75cbf4);
    const v_2365e9 = v_b16994.slice(v_fc4524 < 0 ? v_b16994.length : v_fc4524, (v_fc4524 < 0 ? v_b16994.length : v_fc4524) + v_02be30);
    const v_64f859 = v_2365e9.length === v_02be30 ? v_2365e9[v_2365e9.length - 1].id : null;
    return {
      items: v_2365e9.map((v_8b5cd8) => v_32b73e(v_8b5cd8, v_eb25ce)),
      nextCursor: v_64f859,
    };
  },

  async listMessages(
    v_6e0fd3,
    v_013af2,
    { sessionId: v_c5607b = v_c13be2, cursor: v_75cbf4, limit: v_02be30 = v_b8fec2 }: ListMessagesParams = {},
  ): Promise<v_6ac723> {
    const v_bdb39e = v_119a79();
    const v_b16994 = v_bdb39e.messages
      .filter((v_35f85c) => v_35f85c.cloneId === v_6e0fd3 && v_35f85c.userId === v_013af2)
      .slice()
      .sort((v_779914, v_148ff6) => v_148ff6.id - v_779914.id);
    const v_fc4524 = v_75cbf4 == null ? 0 : v_b16994.findIndex((v_35f85c) => v_35f85c.id < v_75cbf4);
    const v_2365e9 = v_b16994.slice(v_fc4524 < 0 ? v_b16994.length : v_fc4524, (v_fc4524 < 0 ? v_b16994.length : v_fc4524) + v_02be30);
    const v_64f859 = v_2365e9.length === v_02be30 ? v_2365e9[v_2365e9.length - 1].id : null;
    return {
      items: v_2365e9.map((v_35f85c) => v_61516d(v_35f85c, v_c5607b)),
      nextCursor: v_64f859,
    };
  },

  async listFollowedClones(v_43e90c): Promise<v_f6b1e7> {
    const v_bdb39e = v_119a79();
    const v_10387a = v_bdb39e.follows.filter((v_8b5cd8) => v_8b5cd8.followerUserId === v_43e90c);
    const items: v_549f6a[] = [];
    const v_86772a = v_10387a.slice().sort((v_779914, v_148ff6) => {
      const v_7777ca = new Date(v_148ff6.followedAt).getTime() - new Date(v_779914.followedAt).getTime();
      return v_7777ca !== 0 ? v_7777ca : v_148ff6.id - v_779914.id;
    });
    for (const v_8b5cd8 of v_86772a) {
      const v_eb25ce = v_bdb39e.clones.find((v_3f4e2e) => v_3f4e2e.id === v_8b5cd8.followingCloneId);
      if (v_eb25ce) v_4622b9.push(v_ed5a1c(v_eb25ce, v_bdb39e));
    }
    return { items: v_4622b9 };
  },

  async getSession(v_6e0fd3, v_013af2): Promise<v_6dbe7c> {
    const v_bdb39e = v_119a79();
    const v_eb25ce = v_bdb39e.clones.find((v_3f4e2e) => v_3f4e2e.id === v_6e0fd3);
    if (!v_eb25ce) throw new Error(`Clone not found: ${v_6e0fd3}`);
    const v_00efe2 = v_6a944d(v_eb25ce, v_013af2, v_bdb39e);
    if (v_00efe2 == null && v_eb25ce.visibility !== 'public') {
      throw new Error('No access to this clone for session.');
    }
    const v_556427 = `${v_eb25ce.cloneType}-${v_eb25ce.id}`;
    const v_258a05 = `stub-${v_6e0fd3}-${v_013af2}`;
    return {
      sessionId: `sess-${v_258a05}`,
      livekitRoom: `room-${v_6e0fd3}-${v_258a05}`,
      livekitToken: `stub.sess-${v_258a05}.${v_013af2}`,
      cloudflareCallsAppId: 'stub-calls-app',
      loraUri: `r2://afterlife-models/${v_eb25ce.cloneType}/${v_556427}.lora`,
      ttsVoiceUri: `r2://afterlife-voices/${v_eb25ce.cloneType}/${v_556427}.pt`,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      viewerRole: v_00efe2,
    };
  },

  async listShorts(v_013af2): Promise<v_7d4414> {
    const v_bdb39e = v_119a79();
    const v_4622b9 = v_2d9aa2()
      .filter((v_fd5f43) => v_fd5f43.status === 'ready')
      .map((v_fd5f43) => {
        const v_eb25ce = v_bdb39e.clones.find((v_3f4e2e) => v_3f4e2e.id === v_fd5f43.cloneId);
        if (!v_eb25ce) return null;
        const v_2aec08 = v_eb25ce.ownerId === v_013af2;
        const v_552f41 = v_bdb39e.coowners.some(
          (v_c4a45b) => v_c4a45b.cloneId === v_eb25ce.id && v_c4a45b.userId === v_013af2 && v_c4a45b.status === 'approved',
        );
        const v_cf55be = v_eb25ce.visibility === 'public' || v_2aec08 || v_552f41;
        return v_cf55be ? v_846893(v_fd5f43, v_eb25ce) : null;
      })
      .filter((v_62c214): v_62c214 is v_ec2546 => v_62c214 != null)
      .sort((v_779914, v_148ff6) => v_148ff6.shortId - v_779914.shortId);
    return { items: v_4622b9, nextCursor: null };
  },

  async generateShort(
    v_6e0fd3,
    v_013af2,
  ): Promise<{ shortId: number; status: 'queued' }> {
    const v_bdb39e = v_119a79();
    const v_eb25ce = v_bdb39e.clones.find((v_3f4e2e) => v_3f4e2e.id === v_6e0fd3);
    if (!v_eb25ce) throw new Error(`Clone not found: ${v_6e0fd3}`);
    if (v_eb25ce.ownerId !== v_013af2) throw new Error('Forbidden: owner only');
    const v_3ac7e7 = v_bdea6c(v_6e0fd3);
    return { shortId: v_3ac7e7.id, status: 'queued' };
  },

  async getShort(
    v_53aa09,
  ): Promise<{ shortId: number; status: v_924690['status']; mediaUrl: string | null }> {
    const v_fd5f43 = v_d745f1(v_53aa09);
    if (!v_fd5f43) throw new Error(`Short not found: ${v_53aa09}`);
    return { shortId: v_fd5f43.id, status: v_fd5f43.status, mediaUrl: v_fd5f43.mediaUrl };
  },
};

export type ApiClient = typeof v_9a8286;
