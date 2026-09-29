

import { v_c4deb2, v_e662ae } from 'bapkr';

const v_cab842 = 5000;

export function v_1e24e8(v_328259) {
  const v_d20c84 = v_328259.enabled;
  const v_6d7cd8 = v_328259.reportIntervalMs ?? v_cab842;
  const v_bb8499 = v_e662ae(0);
  const v_4400e0 = v_e662ae<number | null>(null);
  const v_5d3ddb = v_e662ae<number>(Date.now());

  v_c4deb2(() => {
    if (!v_d20c84) return;
    let v_f8b770 = true;

    const v_9a5f22 = () => {
      if (!v_f8b770) return;
      v_bb8499.current += 1;
      v_4400e0.current = requestAnimationFrame(v_9a5f22);
    };
    v_4400e0.current = requestAnimationFrame(v_9a5f22);

    const v_4e6894 = setInterval(() => {
      if (!v_f8b770) return;
      const v_5c2f9f = Date.now();
      const v_ef12d9 = (v_5c2f9f - v_5d3ddb.current) / 1000;
      const v_fc7d4e = v_bb8499.current / v_ef12d9;

      console.log(
        `[Call][jsfps] fps=${v_fc7d4e.toFixed(1)} frames=${v_bb8499.current} ` +
          `elapsed=${v_ef12d9.toFixed(1)}s ${v_fc7d4e < 30 ? '⚠️ LOW' : ''}`,
      );
      v_bb8499.current = 0;
      v_5d3ddb.current = v_5c2f9f;
    }, v_6d7cd8);

    return () => {
      v_f8b770 = false;
      if (v_4400e0.current != null) cancelAnimationFrame(v_4400e0.current);
      clearInterval(v_4e6894);
    };
  }, [v_d20c84, v_6d7cd8]);
}
