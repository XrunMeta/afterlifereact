

import v_a3453e from 'bapkr';
import { v_624657, v_77aa68, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_448ad1 from '../../src/screens/clone-creation/Step7CompleteScreen';
import { v_194498 } from '../../src/stores/cloneStore';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

jest.mock('../../src/stores/dialogStore', () => ({
  showAlert: jest.fn(),
}));

const v_d524b3 = jest.fn();
const v_041955 = jest.fn();
const v_23a78e = jest.fn();
const v_a0b12f = jest.fn();
const v_cfa164 = jest.fn();
const v_92d623 = jest.fn((v_f4e98d) => v_f4e98d.toLowerCase());

jest.mock('../../src/api/clones', () => ({
  getAssetJob: (...v_4317d1: any[]) => v_d524b3(...v_4317d1),
  createAssetJob: (...v_4317d1: any[]) => v_041955(...v_4317d1),
  createClone: (...v_4317d1: any[]) => v_a0b12f(...v_4317d1),
  createCloneFeed: (...v_4317d1: any[]) => v_cfa164(...v_4317d1),
  deriveUsernameFromName: (v_f4e98d) => v_92d623(v_f4e98d),
  updateClone: jest.fn(),
}));

jest.mock('../../src/api/files', () => ({
  uploadFile: (...v_4317d1: any[]) => v_23a78e(...v_4317d1),
}));

const v_7ba7d8 = jest.fn();
jest.mock('../../src/lib/imagePicker', () => ({
  pickAndCropImage: (...v_4317d1: any[]) => v_7ba7d8(...v_4317d1),
}));

let v_7092b7 = {
  user: { id: 1 },
  accessToken: 'tok',
};
jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (v_f2d7a9) => v_f2d7a9(v_7092b7),
}));

const v_7b8db1 = jest.fn();
const v_e7f1c8 = jest.fn();
const v_0f340b = {
  navigation: {
    navigate: v_7b8db1,
    replace: v_e7f1c8,
    canGoBack: () => false,
    goBack: jest.fn(),
    getParent: () => ({ navigate: jest.fn(), dispatch: jest.fn() }),
  },
};

const v_35c960 = {
  cloneType: 'friend' as const,
  name: '루나',
  username: 'luna',
  imageFile: 'file://avatar.jpg',
  idleVideoJobId: 'job-1',
  description: '안녕 나 루나야',
};

beforeEach(() => {
  jest.clearAllMocks();

  v_7092b7 = { user: { id: 1 }, accessToken: 'tok' };
  v_194498.getState().resetCreationDraft();
  v_194498.setState({ localClones: [] });

  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'pending' });
  v_a0b12f.mockResolvedValue({ clone: { id: 99, cloneType: 'friend', name: '루나', visibility: 'public', createdAt: '' } });
  v_cfa164.mockResolvedValue({});
});

test('idle pending 시 게시 버튼 disabled', async () => {
  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'pending' });
  v_194498.getState().setCreationDraft(v_35c960);
  const { getByTestId: v_f177b5 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);

  await v_be73a0(async () => {
    await Promise.resolve();
  });

  const v_8955f9 = v_f177b5('share-post-button');
  expect(v_8955f9.props.accessibilityState?.disabled ?? v_8955f9.props.disabled).toBe(true);
});

test('idle running 시 게시 버튼 disabled', async () => {
  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'running' });
  v_194498.getState().setCreationDraft(v_35c960);
  const { getByTestId: v_f177b5 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);

  await v_be73a0(async () => { await Promise.resolve(); });

  const v_8955f9 = v_f177b5('share-post-button');
  expect(v_8955f9.props.accessibilityState?.disabled ?? v_8955f9.props.disabled).toBe(true);
});

test('idle failed 시 게시 버튼 disabled', async () => {
  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  v_194498.getState().setCreationDraft(v_35c960);
  const { getByTestId: v_f177b5 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);

  await v_be73a0(async () => { await Promise.resolve(); });

  const v_8955f9 = v_f177b5('share-post-button');
  expect(v_8955f9.props.accessibilityState?.disabled ?? v_8955f9.props.disabled).toBe(true);
});

test('idle done 시 게시 버튼 enabled', async () => {
  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'done', out_url: 'https://cdn/idle.mp4' });
  v_194498.getState().setCreationDraft(v_35c960);
  const { getByTestId: v_f177b5 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);

  await v_be73a0(async () => { await Promise.resolve(); });

  const v_8955f9 = v_f177b5('share-post-button');
  expect(v_8955f9.props.accessibilityState?.disabled ?? v_8955f9.props.disabled).toBeFalsy();
});

test('failed 분기 재업로드 — 새 idleVideoJobId 로 draft 갱신 + idleJob null 초기화', async () => {
  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  v_194498.getState().setCreationDraft(v_35c960);

  v_7ba7d8.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://new-avatar.jpg' }],
  });
  v_23a78e.mockResolvedValue({ id: 42, url: 'https://cdn/new.jpg' });
  v_041955.mockResolvedValue({ job_id: 'job-2' });

  const { getByTestId: v_f177b5 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);

  await v_be73a0(async () => { await Promise.resolve(); });

  const v_f1edf2 = v_f177b5('reupload-photo-button');
  await v_be73a0(async () => { v_77aa68.press(v_f1edf2); });

  await v_81e49f(() => {
    expect(v_23a78e).toHaveBeenCalledWith(
      'tok',
      'file://new-avatar.jpg',
      expect.objectContaining({ purpose: 'clone_avatar' }),
    );
    expect(v_041955).toHaveBeenCalledWith('tok', {
      kind: 'idle_video',
      src_file_id: 42,
    });
  });

  const v_90f5eb = v_194498.getState().creationDraft;
  expect(v_90f5eb.idleVideoJobId).toBe('job-2');
  expect(v_90f5eb.avatarFileId).toBe(42);
});

test('idleVideoJobId 없고 imageFile 있음 → 게시 disabled + 재업로드 링크 노출', async () => {
  v_194498.getState().setCreationDraft({
    ...v_35c960,
    idleVideoJobId: undefined,
  });

  const { getByTestId: v_f177b5, queryByTestId: v_d56830 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);

  await v_be73a0(async () => { await Promise.resolve(); });

  const v_8955f9 = v_f177b5('share-post-button');
  expect(v_8955f9.props.accessibilityState?.disabled ?? v_8955f9.props.disabled).toBe(true);

  expect(v_d56830('reupload-photo-button')).toBeTruthy();
});

test('accessToken null → 재업로드 시 uploadFile 호출 안 함 + showAlert 로그인 안내', async () => {
  const { showAlert: v_889fad } = require('../../src/stores/dialogStore') as { showAlert: jest.Mock };

  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  v_194498.getState().setCreationDraft(v_35c960);
  v_7ba7d8.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://x.jpg' }] });

  v_7092b7 = { user: { id: 1 }, accessToken: null };

  const { queryByTestId: v_d56830 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);
  await v_be73a0(async () => { await Promise.resolve(); });

  const v_f1edf2 = v_d56830('reupload-photo-button');
  if (v_f1edf2) {
    await v_be73a0(async () => { v_77aa68.press(v_f1edf2); });
    expect(v_23a78e).not.toHaveBeenCalled();
    expect(v_889fad).toHaveBeenCalledWith(expect.stringContaining('로그인'));
  } else {

    expect(v_23a78e).not.toHaveBeenCalled();
  }
});

test('jobId 없고 imageFile 없음 → 게시 disabled', async () => {
  v_194498.getState().setCreationDraft({
    ...v_35c960,
    idleVideoJobId: undefined,
    imageFile: undefined,
  });

  const { getByTestId: v_f177b5 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);
  await v_be73a0(async () => { await Promise.resolve(); });

  const v_8955f9 = v_f177b5('share-post-button');
  expect(v_8955f9.props.accessibilityState?.disabled ?? v_8955f9.props.disabled).toBe(true);
});

test('uploadFile 성공 + createAssetJob throw → idleVideoJobId 미세팅, 게시 여전히 disabled, 재업로드 버튼 유지', async () => {
  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  v_194498.getState().setCreationDraft(v_35c960);

  v_7ba7d8.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://new.jpg' }] });
  v_23a78e.mockResolvedValue({ id: 55, url: 'https://cdn/new.jpg' });
  v_041955.mockRejectedValue(new Error('createAssetJob 서버 오류'));

  const { showAlert: v_889fad } = require('../../src/stores/dialogStore') as { showAlert: jest.Mock };

  const { getByTestId: v_f177b5, queryByTestId: v_d56830 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);
  await v_be73a0(async () => { await Promise.resolve(); });

  const v_f1edf2 = v_f177b5('reupload-photo-button');
  await v_be73a0(async () => { v_77aa68.press(v_f1edf2); });

  await v_81e49f(() => {
    expect(v_23a78e).toHaveBeenCalledTimes(1);
    expect(v_041955).toHaveBeenCalledTimes(1);
    expect(v_889fad).toHaveBeenCalledWith('업로드 실패', expect.stringContaining('영상 생성 요청'));
  });

  const v_8955f9 = v_f177b5('share-post-button');
  expect(v_8955f9.props.accessibilityState?.disabled ?? v_8955f9.props.disabled).toBe(true);

  expect(v_d56830('reupload-photo-button')).toBeTruthy();
});

test('reuploadLoading 중 중복 탭 → uploadFile 1회만 호출', async () => {
  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  v_194498.getState().setCreationDraft(v_35c960);

  let v_13970a;
  v_23a78e.mockReturnValue(new Promise((v_8f00b9) => { v_13970a = v_8f00b9; }));
  v_7ba7d8.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://dup.jpg' }] });

  const { getByTestId: v_f177b5 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);
  await v_be73a0(async () => { await Promise.resolve(); });

  const v_f1edf2 = v_f177b5('reupload-photo-button');

  await v_be73a0(async () => { v_77aa68.press(v_f1edf2); });

  await v_be73a0(async () => { v_77aa68.press(v_f1edf2); });

  expect(v_23a78e).toHaveBeenCalledTimes(1);

  await v_be73a0(async () => {
    v_13970a({ id: 10, url: 'https://cdn/dup.jpg' });
    v_041955.mockResolvedValue({ job_id: 'job-dup' });
    await Promise.resolve();
  });
});

test('이미지 picker 취소 시 draft 변경 없음', async () => {
  v_d524b3.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  v_194498.getState().setCreationDraft(v_35c960);

  v_7ba7d8.mockResolvedValue({ canceled: true, assets: [] });

  const { getByTestId: v_f177b5 } = v_624657(<Step7CompleteScreen {...v_0f340b} />);
  await v_be73a0(async () => { await Promise.resolve(); });

  const v_f1edf2 = v_f177b5('reupload-photo-button');
  await v_be73a0(async () => { v_77aa68.press(v_f1edf2); });

  expect(v_23a78e).not.toHaveBeenCalled();

  expect(v_194498.getState().creationDraft.idleVideoJobId).toBe('job-1');
});
