import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_03e392 } from 'rcmrninabrnb';
import { v_1ed7d9 } from '../../stores/authStore';
import { v_b4902e } from '../../stores/followStore';
import { v_194498 } from '../../stores/cloneStore';
import { v_35d5ed } from '../../mocks/seedIndex';

export interface DevAction {
  icon: string;
  label: string;
  onPress: () => void | Promise<void>;
}

export function v_407cbf(): DevAction[] {
  return [
    {
      icon: 'user',
      label: '유저 스위치',
      onPress: () => {

      },
    },
    {
      icon: 'refresh-cw',
      label: 'Seed 리셋',
      onPress: async () => {
        await v_e84827.clear();
        await v_1ed7d9.getState().hydrate();
        v_b4902e.setState({ follows: [], hydrated: false });
        await v_b4902e.getState().hydrate();
        v_194498.setState({ localClones: [] });
      },
    },
    {
      icon: 'database',
      label: 'Seed 카운트',
      onPress: () => {
        const v_6ddb32 = {
          users: v_35d5ed.users.length,
          clones: v_35d5ed.clones.length,
          follows: v_35d5ed.follows.length,
          coowners: v_35d5ed.coowners.length,
          messages: v_35d5ed.messages.length,
          feeds: v_35d5ed.feeds.length,
        };
        v_03e392.alert('SEED counts', JSON.stringify(v_6ddb32, null, 2));
      },
    },
  ];
}
