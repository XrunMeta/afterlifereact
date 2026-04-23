import v_7d85f3 from './seed/users.json';
import v_6a8743 from './seed/clones.json';
import v_61be66 from './seed/follows.json';
import v_b5e50c from './seed/coowners.json';
import v_f892cc from './seed/feeds.json';
import v_1d14cf from './seed/messages.json';
import v_c3c48e from './seed/shorts.json';
import { v_a151c0, type v_f4506d } from './seedLoader';

export const SEED: v_f4506d = v_a151c0({
  users: v_7d85f3 as unknown[],
  clones: v_6a8743 as unknown[],
  follows: v_61be66 as unknown[],
  coowners: v_b5e50c as unknown[],
  messages: v_1d14cf as unknown[],
  feeds: v_f892cc as unknown[],
  shorts: v_c3c48e as unknown[],
});
