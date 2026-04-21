import v_a3453e from 'bapkr';
import { v_624657 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_448ad1 from '../../src/screens/clone-creation/Step7CompleteScreen';
import { v_194498 } from '../../src/stores/cloneStore';

const v_3c9f12 = {
  navigation: { getParent: () => ({ dispatch: jest.fn() }) },
};

beforeEach(() => {
  v_194498.getState().resetCreationDraft();
  v_194498.setState({ myClones: [] });
});

test('memlow copy shows 추모 톤', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'memlow', name: '엄마', username: '@mom',
    relation: 'mother', imageFile: 'f', voiceFile: 'v',
  });
  const { getByText: v_2b0f8a } = v_624657(<Step7CompleteScreen {...v_3c9f12} />);
  expect(v_2b0f8a(/추억을 이어가요/)).toBeTruthy();
});

test('friend copy shows 발랄 톤', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: 'f', voiceSampleId: 'v1',
  });
  const { getByText: v_2b0f8a } = v_624657(<Step7CompleteScreen {...v_3c9f12} />);
  expect(v_2b0f8a(/친구가 준비됐어요/)).toBeTruthy();
});

test('on mount adds new clone to myClones with derived status', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: undefined, voiceSampleId: undefined,
  });
  v_624657(<Step7CompleteScreen {...v_3c9f12} />);
  const v_3f4e2e = v_194498.getState().myClones[0];
  expect(v_3f4e2e.status).toBe('pending_assets');
});

test('clone with image+voice gets status=active', () => {
  v_194498.getState().setCreationDraft({
    cloneType: 'friend', name: '루나', username: '@luna',
    interests: ['a'], imageFile: 'f', voiceSampleId: 'v1',
  });
  v_624657(<Step7CompleteScreen {...v_3c9f12} />);
  expect(v_194498.getState().myClones[0].status).toBe('active');
});
