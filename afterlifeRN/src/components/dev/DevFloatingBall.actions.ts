import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useFollowStore } from '../../stores/followStore';
import { useCloneStore } from '../../stores/cloneStore';
import { seedSource } from '../../api/source';

export interface DevAction {
  icon: string;
  label: string;
  onPress: () => void | Promise<void>;
}

export function defaultDevActions(): DevAction[] {
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
        await AsyncStorage.clear();
        await useAuthStore.getState().hydrate();
        useFollowStore.setState({ follows: [], hydrated: false });
        await useFollowStore.getState().hydrate();
        useCloneStore.setState({ localClones: [] });
      },
    },
    {
      icon: 'database',
      label: 'Seed 카운트',
      onPress: () => {
        const counts = {
          users: seedSource.users().length,
          clones: seedSource.clones().length,
          follows: seedSource.follows().length,
          coowners: seedSource.coowners().length,
          messages: seedSource.messages().length,
          feeds: seedSource.feeds().length,
        };
        Alert.alert('SEED counts', JSON.stringify(counts, null, 2));
      },
    },
  ];
}
