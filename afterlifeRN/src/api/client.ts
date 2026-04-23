import { SEED } from '../mocks/seedIndex';
import type { Seed } from '../mocks/seedLoader';
import {
  toApiClone,
  toApiCloneListItem,
  toApiFeed,
  toApiMessage,
  computeViewerRole,
  toApiShort,
} from './seedAdapter';
import type {
  ApiClone,
  ApiCloneListItem,
  ApiFeedList,
  ApiFollowedCloneList,
  ApiMessageList,
  ApiSession,
  ApiShort,
  ApiShortsList,
} from './types';
import type { DomainShort } from '../types/domain';
import { allShorts, appendGeneratedShort, findShort } from './shortsStore';

const DEFAULT_LIMIT = 20;
const DEFAULT_SESSION_ID = 'sess-stub-local';

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

function getSeed(): Seed {
  return SEED;
}

export const apiClient = {
  async getClone(cloneId: number, { viewerId }: GetCloneParams): Promise<{ clone: ApiClone }> {
    const seed = getSeed();
    const clone = seed.clones.find((c) => c.id === cloneId);
    if (!clone) throw new Error(`Clone not found: ${cloneId}`);
    return { clone: toApiClone(clone, seed, viewerId) };
  },

  async listFeeds(
    cloneId: number,
    { cursor, limit = DEFAULT_LIMIT }: ListParams = {},
  ): Promise<ApiFeedList> {
    const seed = getSeed();
    const clone = seed.clones.find((c) => c.id === cloneId);
    if (!clone) throw new Error(`Clone not found: ${cloneId}`);
    const sorted = seed.feeds
      .filter((f) => f.cloneId === cloneId)
      .slice()
      .sort((a, b) => b.id - a.id);
    const startIdx = cursor == null ? 0 : sorted.findIndex((f) => f.id < cursor);
    const page = sorted.slice(startIdx < 0 ? sorted.length : startIdx, (startIdx < 0 ? sorted.length : startIdx) + limit);
    const nextCursor = page.length === limit ? page[page.length - 1].id : null;
    return {
      items: page.map((f) => toApiFeed(f, clone)),
      nextCursor,
    };
  },

  async listMessages(
    cloneId: number,
    viewerId: number,
    { sessionId = DEFAULT_SESSION_ID, cursor, limit = DEFAULT_LIMIT }: ListMessagesParams = {},
  ): Promise<ApiMessageList> {
    const seed = getSeed();
    const sorted = seed.messages
      .filter((m) => m.cloneId === cloneId && m.userId === viewerId)
      .slice()
      .sort((a, b) => b.id - a.id);
    const startIdx = cursor == null ? 0 : sorted.findIndex((m) => m.id < cursor);
    const page = sorted.slice(startIdx < 0 ? sorted.length : startIdx, (startIdx < 0 ? sorted.length : startIdx) + limit);
    const nextCursor = page.length === limit ? page[page.length - 1].id : null;
    return {
      items: page.map((m) => toApiMessage(m, sessionId)),
      nextCursor,
    };
  },

  async listFollowedClones(userId: number): Promise<ApiFollowedCloneList> {
    const seed = getSeed();
    const followed = seed.follows.filter((f) => f.followerUserId === userId);
    const items: ApiCloneListItem[] = [];
    const sortedFollows = followed.slice().sort((a, b) => {
      const timeDiff = new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime();
      return timeDiff !== 0 ? timeDiff : b.id - a.id;
    });
    for (const f of sortedFollows) {
      const clone = seed.clones.find((c) => c.id === f.followingCloneId);
      if (clone) items.push(toApiCloneListItem(clone, seed));
    }
    return { items };
  },

  async getSession(cloneId: number, viewerId: number): Promise<ApiSession> {
    const seed = getSeed();
    const clone = seed.clones.find((c) => c.id === cloneId);
    if (!clone) throw new Error(`Clone not found: ${cloneId}`);
    const viewerRole = computeViewerRole(clone, viewerId, seed);
    if (viewerRole == null && clone.visibility !== 'public') {
      throw new Error('No access to this clone for session.');
    }
    const username = `${clone.cloneType}-${clone.id}`;
    const stubId = `stub-${cloneId}-${viewerId}`;
    return {
      sessionId: `sess-${stubId}`,
      livekitRoom: `room-${cloneId}-${stubId}`,
      livekitToken: `stub.sess-${stubId}.${viewerId}`,
      cloudflareCallsAppId: 'stub-calls-app',
      loraUri: `r2://afterlife-models/${clone.cloneType}/${username}.lora`,
      ttsVoiceUri: `r2://afterlife-voices/${clone.cloneType}/${username}.pt`,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      viewerRole,
    };
  },

  async listShorts(viewerId: number): Promise<ApiShortsList> {
    const seed = getSeed();
    const items = allShorts()
      .filter((s) => s.status === 'ready')
      .map((s) => {
        const clone = seed.clones.find((c) => c.id === s.cloneId);
        if (!clone) return null;
        const isOwner = clone.ownerId === viewerId;
        const isCoowner = seed.coowners.some(
          (co) => co.cloneId === clone.id && co.userId === viewerId && co.status === 'approved',
        );
        const visible = clone.visibility === 'public' || isOwner || isCoowner;
        return visible ? toApiShort(s, clone) : null;
      })
      .filter((x): x is ApiShort => x != null)
      .sort((a, b) => b.shortId - a.shortId);
    return { items, nextCursor: null };
  },

  async generateShort(
    cloneId: number,
    viewerId: number,
  ): Promise<{ shortId: number; status: 'queued' }> {
    const seed = getSeed();
    const clone = seed.clones.find((c) => c.id === cloneId);
    if (!clone) throw new Error(`Clone not found: ${cloneId}`);
    if (clone.ownerId !== viewerId) throw new Error('Forbidden: owner only');
    const row = appendGeneratedShort(cloneId);
    return { shortId: row.id, status: 'queued' };
  },

  async getShort(
    shortId: number,
  ): Promise<{ shortId: number; status: DomainShort['status']; mediaUrl: string | null }> {
    const s = findShort(shortId);
    if (!s) throw new Error(`Short not found: ${shortId}`);
    return { shortId: s.id, status: s.status, mediaUrl: s.mediaUrl };
  },
};

export type ApiClient = typeof apiClient;
