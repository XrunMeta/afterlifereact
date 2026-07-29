import { v_4eac84 } from 'tdbilgxptaometuphydosyywsglhnlfgkfkzstthk';
import { v_220c23, v_618ab1 } from '../googleAuth';

jest.mock('tdbilgxptaometuphydosyywsglhnlfgkfkzstthk', () => ({
  GoogleSignin: { configure: jest.fn() },
}));

const v_d71d2a = v_4eac84.configure as unknown as jest.Mock;

beforeEach(() => {
  v_d71d2a.mockReset();
  v_618ab1();
});

test('성공하면 true 를 반환하고 configure 를 1회 호출', () => {
  v_d71d2a.mockImplementation(() => undefined);
  expect(v_220c23()).toBe(true);
  expect(v_d71d2a).toHaveBeenCalledTimes(1);
});

test('두 번 호출해도 configure 는 1회만 실행된다', () => {
  v_d71d2a.mockImplementation(() => undefined);
  v_220c23();
  v_220c23();
  expect(v_d71d2a).toHaveBeenCalledTimes(1);
});

test('configure 가 throw 해도 던지지 않고 false 를 반환', () => {
  v_d71d2a.mockImplementation(() => {
    throw new Error('no client id');
  });
  expect(() => v_220c23()).not.toThrow();
  expect(v_220c23()).toBe(false);
});

test('실패 후 재호출해도 재시도하지 않는다', () => {
  v_d71d2a.mockImplementation(() => {
    throw new Error('no client id');
  });
  v_220c23();
  v_220c23();
  expect(v_d71d2a).toHaveBeenCalledTimes(1);
});

test('configure 가 rejected promise 를 반환해도 unhandled rejection 이 나지 않는다', async () => {
  v_d71d2a.mockImplementation(() => Promise.reject(new Error('async fail')));
  expect(v_220c23()).toBe(true); 

  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 0));
});
