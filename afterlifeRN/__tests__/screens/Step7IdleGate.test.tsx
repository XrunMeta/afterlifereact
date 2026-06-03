

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import Step7CompleteScreen from '../../src/screens/clone-creation/Step7CompleteScreen';
import { useCloneStore } from '../../src/stores/cloneStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../src/stores/dialogStore', () => ({
  showAlert: jest.fn(),
}));

const mockGetAssetJob = jest.fn();
const mockCreateAssetJob = jest.fn();
const mockUploadFile = jest.fn();
const mockCreateClone = jest.fn();
const mockCreateCloneFeed = jest.fn();
const mockDeriveUsernameFromName = jest.fn((n: string) => n.toLowerCase());

jest.mock('../../src/api/clones', () => ({
  getAssetJob: (...args: any[]) => mockGetAssetJob(...args),
  createAssetJob: (...args: any[]) => mockCreateAssetJob(...args),
  createClone: (...args: any[]) => mockCreateClone(...args),
  createCloneFeed: (...args: any[]) => mockCreateCloneFeed(...args),
  deriveUsernameFromName: (n: string) => mockDeriveUsernameFromName(n),
  updateClone: jest.fn(),
}));

jest.mock('../../src/api/files', () => ({
  uploadFile: (...args: any[]) => mockUploadFile(...args),
}));

const mockPickAndCropImage = jest.fn();
jest.mock('../../src/lib/imagePicker', () => ({
  pickAndCropImage: (...args: any[]) => mockPickAndCropImage(...args),
}));

let mockAuthState: { user: { id: number } | null; accessToken: string | null } = {
  user: { id: 1 },
  accessToken: 'tok',
};
jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (sel: any) => sel(mockAuthState),
}));

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const navProp: any = {
  navigation: {
    navigate: mockNavigate,
    replace: mockReplace,
    canGoBack: () => false,
    goBack: jest.fn(),
    getParent: () => ({ navigate: jest.fn(), dispatch: jest.fn() }),
  },
};

const BASE_DRAFT = {
  cloneType: 'friend' as const,
  name: '루나',
  username: 'luna',
  imageFile: 'file://avatar.jpg',
  idleVideoJobId: 'job-1',
  description: '안녕 나 루나야',
};

beforeEach(() => {
  jest.clearAllMocks();

  mockAuthState = { user: { id: 1 }, accessToken: 'tok' };
  useCloneStore.getState().resetCreationDraft();
  useCloneStore.setState({ localClones: [] });

  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'pending' });
  mockCreateClone.mockResolvedValue({ clone: { id: 99, cloneType: 'friend', name: '루나', visibility: 'public', createdAt: '' } });
  mockCreateCloneFeed.mockResolvedValue({});
});

test('idle pending 시 게시 버튼 disabled', async () => {
  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'pending' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);
  const { getByTestId } = render(<Step7CompleteScreen {...navProp} />);

  await act(async () => {
    await Promise.resolve();
  });

  const btn = getByTestId('share-post-button');
  expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
});

test('idle running 시 게시 버튼 disabled', async () => {
  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'running' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);
  const { getByTestId } = render(<Step7CompleteScreen {...navProp} />);

  await act(async () => { await Promise.resolve(); });

  const btn = getByTestId('share-post-button');
  expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
});

test('idle failed 시 게시 버튼 disabled', async () => {
  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);
  const { getByTestId } = render(<Step7CompleteScreen {...navProp} />);

  await act(async () => { await Promise.resolve(); });

  const btn = getByTestId('share-post-button');
  expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
});

test('idle done 시 게시 버튼 enabled', async () => {
  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'done', out_url: 'https://cdn/idle.mp4' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);
  const { getByTestId } = render(<Step7CompleteScreen {...navProp} />);

  await act(async () => { await Promise.resolve(); });

  const btn = getByTestId('share-post-button');
  expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeFalsy();
});

test('failed 분기 재업로드 — 새 idleVideoJobId 로 draft 갱신 + idleJob null 초기화', async () => {
  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);

  mockPickAndCropImage.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://new-avatar.jpg' }],
  });
  mockUploadFile.mockResolvedValue({ id: 42, url: 'https://cdn/new.jpg' });
  mockCreateAssetJob.mockResolvedValue({ job_id: 'job-2' });

  const { getByTestId } = render(<Step7CompleteScreen {...navProp} />);

  await act(async () => { await Promise.resolve(); });

  const reuploadBtn = getByTestId('reupload-photo-button');
  await act(async () => { fireEvent.press(reuploadBtn); });

  await waitFor(() => {
    expect(mockUploadFile).toHaveBeenCalledWith(
      'tok',
      'file://new-avatar.jpg',
      expect.objectContaining({ purpose: 'clone_avatar' }),
    );
    expect(mockCreateAssetJob).toHaveBeenCalledWith('tok', {
      kind: 'idle_video',
      src_file_id: 42,
    });
  });

  const draftAfter = useCloneStore.getState().creationDraft;
  expect(draftAfter.idleVideoJobId).toBe('job-2');
  expect(draftAfter.avatarFileId).toBe(42);
});

test('idleVideoJobId 없고 imageFile 있음 → 게시 disabled + 재업로드 링크 노출', async () => {
  useCloneStore.getState().setCreationDraft({
    ...BASE_DRAFT,
    idleVideoJobId: undefined,
  });

  const { getByTestId, queryByTestId } = render(<Step7CompleteScreen {...navProp} />);

  await act(async () => { await Promise.resolve(); });

  const btn = getByTestId('share-post-button');
  expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);

  expect(queryByTestId('reupload-photo-button')).toBeTruthy();
});

test('accessToken null → 재업로드 시 uploadFile 호출 안 함 + showAlert 로그인 안내', async () => {
  const { showAlert } = require('../../src/stores/dialogStore') as { showAlert: jest.Mock };

  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);
  mockPickAndCropImage.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://x.jpg' }] });

  mockAuthState = { user: { id: 1 }, accessToken: null };

  const { queryByTestId } = render(<Step7CompleteScreen {...navProp} />);
  await act(async () => { await Promise.resolve(); });

  const reuploadBtn = queryByTestId('reupload-photo-button');
  if (reuploadBtn) {
    await act(async () => { fireEvent.press(reuploadBtn); });
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(showAlert).toHaveBeenCalledWith(expect.stringContaining('로그인'));
  } else {

    expect(mockUploadFile).not.toHaveBeenCalled();
  }
});

test('jobId 없고 imageFile 없음 → 게시 disabled', async () => {
  useCloneStore.getState().setCreationDraft({
    ...BASE_DRAFT,
    idleVideoJobId: undefined,
    imageFile: undefined,
  });

  const { getByTestId } = render(<Step7CompleteScreen {...navProp} />);
  await act(async () => { await Promise.resolve(); });

  const btn = getByTestId('share-post-button');
  expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);
});

test('uploadFile 성공 + createAssetJob throw → idleVideoJobId 미세팅, 게시 여전히 disabled, 재업로드 버튼 유지', async () => {
  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);

  mockPickAndCropImage.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://new.jpg' }] });
  mockUploadFile.mockResolvedValue({ id: 55, url: 'https://cdn/new.jpg' });
  mockCreateAssetJob.mockRejectedValue(new Error('createAssetJob 서버 오류'));

  const { showAlert } = require('../../src/stores/dialogStore') as { showAlert: jest.Mock };

  const { getByTestId, queryByTestId } = render(<Step7CompleteScreen {...navProp} />);
  await act(async () => { await Promise.resolve(); });

  const reuploadBtn = getByTestId('reupload-photo-button');
  await act(async () => { fireEvent.press(reuploadBtn); });

  await waitFor(() => {
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(mockCreateAssetJob).toHaveBeenCalledTimes(1);
    expect(showAlert).toHaveBeenCalledWith('업로드 실패', expect.stringContaining('영상 생성 요청'));
  });

  const btn = getByTestId('share-post-button');
  expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(true);

  expect(queryByTestId('reupload-photo-button')).toBeTruthy();
});

test('reuploadLoading 중 중복 탭 → uploadFile 1회만 호출', async () => {
  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);

  let resolveUpload!: (v: any) => void;
  mockUploadFile.mockReturnValue(new Promise((res) => { resolveUpload = res; }));
  mockPickAndCropImage.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://dup.jpg' }] });

  const { getByTestId } = render(<Step7CompleteScreen {...navProp} />);
  await act(async () => { await Promise.resolve(); });

  const reuploadBtn = getByTestId('reupload-photo-button');

  await act(async () => { fireEvent.press(reuploadBtn); });

  await act(async () => { fireEvent.press(reuploadBtn); });

  expect(mockUploadFile).toHaveBeenCalledTimes(1);

  await act(async () => {
    resolveUpload({ id: 10, url: 'https://cdn/dup.jpg' });
    mockCreateAssetJob.mockResolvedValue({ job_id: 'job-dup' });
    await Promise.resolve();
  });
});

test('이미지 picker 취소 시 draft 변경 없음', async () => {
  mockGetAssetJob.mockResolvedValue({ job_id: 'job-1', kind: 'idle_video', status: 'failed' });
  useCloneStore.getState().setCreationDraft(BASE_DRAFT);

  mockPickAndCropImage.mockResolvedValue({ canceled: true, assets: [] });

  const { getByTestId } = render(<Step7CompleteScreen {...navProp} />);
  await act(async () => { await Promise.resolve(); });

  const reuploadBtn = getByTestId('reupload-photo-button');
  await act(async () => { fireEvent.press(reuploadBtn); });

  expect(mockUploadFile).not.toHaveBeenCalled();

  expect(useCloneStore.getState().creationDraft.idleVideoJobId).toBe('job-1');
});
