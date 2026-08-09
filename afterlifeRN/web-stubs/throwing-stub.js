

const STUB = process.env.EXPO_WEB_STUB_NAME || "unknown";

function boom(prop) {
  throw new Error(
    `[web-stub] 네이티브 전용 모듈에 접근했습니다: ${STUB}.${String(prop)}\n` +
      `이 경로는 웹 번들에서 스텁되어 있습니다. 웹 E2E 로 검증할 수 없는 영역입니다.`,
  );
}

const handler = {
  get(_t, prop) {

    if (
      prop === "__esModule" ||
      prop === "default" ||
      typeof prop === "symbol"
    ) {
      return prop === "__esModule" ? true : undefined;
    }
    return new Proxy(function () {}, {
      apply: () => boom(prop),
      construct: () => boom(prop),
      get: (_t2, p2) => boom(`${String(prop)}.${String(p2)}`),
    });
  },
};

module.exports = new Proxy({}, handler);
