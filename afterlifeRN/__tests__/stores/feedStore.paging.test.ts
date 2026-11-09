import { v_37977a } from '../../src/stores/feedStore';
import { v_f5cc38 } from '../../src/api/clones';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);
jest.mock('../../src/api/clones', () => ({
  ...jest.requireActual('../../src/api/clones'),
  listDiscoverFeeds: jest.fn(),
}));

const v_ef8ab1 = v_f5cc38 as jest.Mock;
const v_8c0b26 = (v_6e0fd3, v_db2b0a = false) => ({ id: v_6e0fd3 * 10, cloneId: v_6e0fd3, likedByMe: v_db2b0a }) as any;
const v_52e08b = () => v_37977a.getState().apiFeeds?.map((v_8b5cd8) => v_8b5cd8.cloneId);

describe('feedStore 홈 피드 페이징', () => {
  beforeEach(() => {
    v_ef8ab1.mockReset();
    v_37977a.getState().resetForLogout();
  });

  it('첫 로드는 10개만 요청하고 다음 커서를 기억한다', async () => {
    v_ef8ab1.mockResolvedValue({ items: [v_8c0b26(30), v_8c0b26(29)], nextCursor: 29 });
    await v_37977a.getState().loadDiscover();
    expect(v_ef8ab1.mock.calls[0][0].limit).toBe(10);
    expect(v_ef8ab1.mock.calls[0][0].cursor).toBeUndefined();
    expect(v_37977a.getState().apiNextCursor).toBe(29);
  });

  it('다음 페이지를 뒤에 붙이고 중복은 뺀다', async () => {
    v_ef8ab1.mockResolvedValueOnce({ items: [v_8c0b26(30), v_8c0b26(29)], nextCursor: 29 });
    await v_37977a.getState().loadDiscover();
    v_ef8ab1.mockResolvedValueOnce({ items: [v_8c0b26(29), v_8c0b26(28, true)], nextCursor: null });
    await v_37977a.getState().loadMoreDiscover();
    expect(v_ef8ab1.mock.calls[1][0].cursor).toBe(29);
    expect(v_52e08b()).toEqual([30, 29, 28]);
    expect(v_37977a.getState().apiNextCursor).toBeNull();
    expect(v_37977a.getState().likedIds).toContain(280);
  });

  it('다음 페이지가 없으면 요청하지 않는다', async () => {
    v_ef8ab1.mockResolvedValueOnce({ items: [v_8c0b26(30)], nextCursor: null });
    await v_37977a.getState().loadDiscover();
    await v_37977a.getState().loadMoreDiscover();
    expect(v_ef8ab1).toHaveBeenCalledTimes(1);
  });

  it('탭 복귀 새로고침은 첫 페이지만 갈고 이미 받은 뒤쪽 카드는 유지한다', async () => {
    v_ef8ab1.mockResolvedValueOnce({ items: [v_8c0b26(30), v_8c0b26(29)], nextCursor: 29 });
    await v_37977a.getState().loadDiscover();
    v_ef8ab1.mockResolvedValueOnce({ items: [v_8c0b26(28), v_8c0b26(27)], nextCursor: 27 });
    await v_37977a.getState().loadMoreDiscover();
    v_ef8ab1.mockResolvedValueOnce({ items: [v_8c0b26(31), v_8c0b26(30)], nextCursor: 30 });
    await v_37977a.getState().loadDiscover();
    expect(v_52e08b()).toEqual([31, 30, 29, 28, 27]);
    expect(v_37977a.getState().apiNextCursor).toBe(27);
  });

  it('실패하면 커서를 유지해 다시 시도할 수 있다', async () => {
    v_ef8ab1.mockResolvedValueOnce({ items: [v_8c0b26(30)], nextCursor: 30 });
    await v_37977a.getState().loadDiscover();
    v_ef8ab1.mockRejectedValueOnce(new Error('net'));
    await v_37977a.getState().loadMoreDiscover();
    expect(v_37977a.getState().apiNextCursor).toBe(30);
    expect(v_37977a.getState().apiLoadingMore).toBe(false);
  });

  it('로그아웃 뒤 늦게 온 응답은 버린다', async () => {
    v_ef8ab1.mockResolvedValueOnce({ items: [v_8c0b26(30)], nextCursor: 30 });
    await v_37977a.getState().loadDiscover();
    let v_6f7712 = () => {};
    v_ef8ab1.mockReturnValueOnce(new Promise((v_cb35cb) => { v_6f7712 = v_cb35cb; }));
    const v_483de2 = v_37977a.getState().loadMoreDiscover();
    v_37977a.getState().resetForLogout();
    v_6f7712({ items: [v_8c0b26(29)], nextCursor: null });
    await v_483de2;
    expect(v_37977a.getState().apiFeeds).toBeNull();
  });
});
