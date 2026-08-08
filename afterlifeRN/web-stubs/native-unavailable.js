

const v_689657 = {
  get(v_63b0c7, v_e36420) {
    if (v_e36420 === '__esModule') return true;
    if (v_e36420 === 'default') return new Proxy({}, v_689657);

    if (v_e36420 === 'then' || v_e36420 === Symbol.toPrimitive || typeof v_e36420 === 'symbol') {
      return undefined;
    }
    return (...v_4317d1) => {
      throw new Error(
        `[web-stub] 네이티브 전용 모듈의 "${String(v_e36420)}" 를 웹에서 호출했습니다. ` +
          `이 경로는 웹 E2E 의 검증 범위 밖입니다 — 시뮬레이터에서 확인하세요.`,
      );
    };
  },
};

module.exports = new Proxy({}, v_689657);
