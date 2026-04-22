import { v_c4deb2, v_5ab095 } from 'bapkr';
import v_e84827 from 'bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv';

export interface BallPosition {
  x: number;
  y: number;
}

const v_d9b84e = '@afterlifeRN/devBall/pos';
const v_66f4f0 = { x: 0, y: 200 };

export function v_7ed42d() {
  const [v_9e7a9d, v_b645f3] = v_5ab095<BallPosition>(v_66f4f0);

  v_c4deb2(() => {
    v_e84827.getItem(v_d9b84e).then((v_479f05) => {
      if (v_479f05) {
        try {
          v_b645f3(JSON.parse(v_479f05));
        } catch {

        }
      }
    });
  }, []);

  const v_1e693b = async (v_e2a85c) => {
    v_b645f3(v_e2a85c);
    await v_e84827.setItem(v_d9b84e, JSON.stringify(v_e2a85c));
  };

  return { pos: v_9e7a9d, save: v_1e693b };
}
