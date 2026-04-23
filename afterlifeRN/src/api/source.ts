import { v_35d5ed } from '../mocks/seedIndex';
import type { v_f4506d } from '../mocks/seedLoader';

export function v_12ba0d(): v_f4506d {
  return v_35d5ed;
}

export const v_694b7f = {
  users: () => v_35d5ed.users,
  clones: () => v_35d5ed.clones,
  follows: () => v_35d5ed.follows,
  coowners: () => v_35d5ed.coowners,
  feeds: () => v_35d5ed.feeds,
  messages: () => v_35d5ed.messages,
  shorts: () => v_35d5ed.shorts,
};
