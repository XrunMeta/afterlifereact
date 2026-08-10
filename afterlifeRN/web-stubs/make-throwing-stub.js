

module.exports = function v_06e1dd(v_1388b6) {
  function v_6adfe8(v_e36420) {
    throw new Error(
      `[web-stub] 네이티브 전용 모듈에 접근했습니다: ${v_1388b6}.${String(v_e36420)}\n` +
        `이 경로는 웹 번들에서 스텁되어 있습니다. 웹 E2E 로 검증할 수 없는 영역이며,` +
        ` 실기(시뮬레이터/기기)로 확인해야 합니다.`,
    );
  }

  const v_5f6a42 = (v_e36420) =>
    new Proxy(function () {}, {
      apply: () => v_6adfe8(v_e36420),
      construct: () => v_6adfe8(v_e36420),
      get: (v_d53ff0, v_e2a85c) => v_6adfe8(`${String(v_e36420)}.${String(v_e2a85c)}`),
    });

  return new Proxy(
    {},
    {
      get(v_d53ff0, v_e36420) {

        if (v_e36420 === "__esModule") return true;

        if (v_e36420 === "then") return undefined;
        if (typeof v_e36420 === "symbol") return undefined;

        return v_5f6a42(v_e36420);
      },
    },
  );
};
