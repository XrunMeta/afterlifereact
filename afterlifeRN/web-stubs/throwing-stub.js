

const v_b18cd4 = process.env.EXPO_WEB_STUB_NAME || "unknown";

function v_6adfe8(v_e36420) {
  throw new Error(
    `[web-stub] 네이티브 전용 모듈에 접근했습니다: ${v_b18cd4}.${String(v_e36420)}\n` +
      `이 경로는 웹 번들에서 스텁되어 있습니다. 웹 E2E 로 검증할 수 없는 영역입니다.`,
  );
}

const v_689657 = {
  get(v_d53ff0, v_e36420) {

    if (
      v_e36420 === "__esModule" ||
      v_e36420 === "default" ||
      typeof v_e36420 === "symbol"
    ) {
      return v_e36420 === "__esModule" ? true : undefined;
    }
    return new Proxy(function () {}, {
      apply: () => v_6adfe8(v_e36420),
      construct: () => v_6adfe8(v_e36420),
      get: (v_758859, v_d6c160) => v_6adfe8(`${String(v_e36420)}.${String(v_d6c160)}`),
    });
  },
};

module.exports = new Proxy({}, v_689657);
