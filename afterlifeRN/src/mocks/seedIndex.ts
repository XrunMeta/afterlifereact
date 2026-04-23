import usersRaw from './seed/users.json';
import clonesRaw from './seed/clones.json';
import followsRaw from './seed/follows.json';
import coownersRaw from './seed/coowners.json';
import feedsRaw from './seed/feeds.json';
import messagesRaw from './seed/messages.json';
import shortsRaw from './seed/shorts.json';
import { loadSeed, type Seed } from './seedLoader';

export const SEED: Seed = loadSeed({
  users: usersRaw as unknown[],
  clones: clonesRaw as unknown[],
  follows: followsRaw as unknown[],
  coowners: coownersRaw as unknown[],
  messages: messagesRaw as unknown[],
  feeds: feedsRaw as unknown[],
  shorts: shortsRaw as unknown[],
});
