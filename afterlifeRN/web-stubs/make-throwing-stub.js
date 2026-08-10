

module.exports = function makeThrowingStub(moduleName) {
  function boom(prop) {
    throw new Error(
      `[web-stub] 네이티브 전용 모듈에 접근했습니다: ${moduleName}.${String(prop)}\n` +
        `이 경로는 웹 번들에서 스텁되어 있습니다. 웹 E2E 로 검증할 수 없는 영역이며,` +
        ` 실기(시뮬레이터/기기)로 확인해야 합니다.`,
    );
  }

  const callableBoom = (prop) =>
    new Proxy(function () {}, {
      apply: () => boom(prop),
      construct: () => boom(prop),
      get: (_t, p) => boom(`${String(prop)}.${String(p)}`),
    });

  return new Proxy(
    {},
    {
      get(_t, prop) {

        if (prop === "__esModule") return true;

        if (prop === "then") return undefined;
        if (typeof prop === "symbol") return undefined;

        return callableBoom(prop);
      },
    },
  );
};
