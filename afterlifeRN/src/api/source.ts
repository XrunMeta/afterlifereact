import { SEED } from '../mocks/seedIndex';
import type { Seed } from '../mocks/seedLoader';

export function getSeedSnapshot(): Seed {
  return SEED;
}

export const seedSource = {
  users: () => SEED.users,
  clones: () => SEED.clones,
  follows: () => SEED.follows,
  coowners: () => SEED.coowners,
  feeds: () => SEED.feeds,
  messages: () => SEED.messages,
  shorts: () => SEED.shorts,
};
