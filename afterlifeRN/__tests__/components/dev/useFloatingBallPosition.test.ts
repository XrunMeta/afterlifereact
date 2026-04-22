import { v_0da18b, v_be73a0, v_81e49f } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';
import { v_7ed42d } from '../../../src/components/dev/useFloatingBallPosition';

jest.mock('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv', () =>
  require('jmodvmzutjjlqeiajiskycccgqlnemzvelnxpqdutwgcosijlniottagirzjjqcnb'),
);

beforeEach(async () => {
  await v_e84827.clear();
});

test('loads default position on first mount', () => {
  const { result: v_43c42e } = v_0da18b(() => v_7ed42d());
  expect(v_43c42e.current.pos).toEqual({ x: 0, y: 200 });
});

test('persists updated position', async () => {
  const { result: v_43c42e } = v_0da18b(() => v_7ed42d());
  await v_be73a0(async () => {
    await v_43c42e.current.save({ x: 50, y: 100 });
  });
  const v_479f05 = await v_e84827.getItem('@afterlifeRN/devBall/pos');
  expect(v_479f05).toBe(JSON.stringify({ x: 50, y: 100 }));
  expect(v_43c42e.current.pos).toEqual({ x: 50, y: 100 });
});

test('hydrates saved position from storage on mount', async () => {
  await v_e84827.setItem(
    '@afterlifeRN/devBall/pos',
    JSON.stringify({ x: 999, y: 42 }),
  );
  const { result: v_43c42e } = v_0da18b(() => v_7ed42d());
  await v_81e49f(() => {
    expect(v_43c42e.current.pos).toEqual({ x: 999, y: 42 });
  });
});
