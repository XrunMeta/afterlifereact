

import { v_a151c0, type v_f4506d } from './seedLoader';

const EMPTY_SEED: v_f4506d = {
  users: [],
  clones: [],
  follows: [],
  coowners: [],
  messages: [],
  feeds: [],
  shorts: [],
};

export const SEED: v_f4506d = __DEV__
  ? v_a151c0({
      users: require('./seed/users.json') as unknown[],
      clones: require('./seed/clones.json') as unknown[],
      follows: require('./seed/follows.json') as unknown[],
      coowners: require('./seed/coowners.json') as unknown[],
      messages: require('./seed/messages.json') as unknown[],
      feeds: require('./seed/feeds.json') as unknown[],
      shorts: require('./seed/shorts.json') as unknown[],
    })
  : v_e75d70;
