

const handler = {
  get(_target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return new Proxy({}, handler);

    if (prop === 'then' || prop === Symbol.toPrimitive || typeof prop === 'symbol') {
      return undefined;
    }
    return (...args) => {
      throw new Error(
        `[web-stub] 네이티브 전용 모듈의 "${String(prop)}" 를 웹에서 호출했습니다. ` +
          `이 경로는 웹 E2E 의 검증 범위 밖입니다 — 시뮬레이터에서 확인하세요.`,
      );
    };
  },
};

module.exports = new Proxy({}, handler);
