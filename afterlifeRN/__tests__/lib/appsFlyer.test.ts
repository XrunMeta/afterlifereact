

type Sdk = {
  initSdk: jest.Mock;
  logEvent: jest.Mock;
  setCustomerUserId: jest.Mock;
};

function v_f6f5de(v_c9c489, v_e16099 = "android") {
  const v_2b9521 = { initSdk: jest.fn(), logEvent: jest.fn(), setCustomerUserId: jest.fn() };

  jest.resetModules();
  if (v_c9c489.key === undefined) delete process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY;
  else process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY = v_c9c489.key;
  if (v_c9c489.iosAppId === undefined) delete process.env.EXPO_PUBLIC_APPSFLYER_APP_ID_IOS;
  else process.env.EXPO_PUBLIC_APPSFLYER_APP_ID_IOS = v_c9c489.iosAppId;
  jest.doMock("react-native", () => ({ Platform: { OS: v_e16099 } }));
  jest.doMock("react-native-appsflyer", () => ({ __esModule: true, default: v_2b9521 }));
  const v_06a17d = require("../../src/lib/appsFlyer");
  return { mod: v_06a17d, sdk: v_2b9521 };
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY;
  delete process.env.EXPO_PUBLIC_APPSFLYER_APP_ID_IOS;
});

describe("appsFlyer", () => {
  it("키가 없으면 SDK 를 초기화하지 않고 이벤트도 보내지 않는다", () => {
    const { mod: v_06a17d, sdk: v_2b9521 } = v_f6f5de({});
    v_06a17d.initAppsFlyer();
    v_06a17d.logAppsFlyerLogin("email");
    v_06a17d.setAppsFlyerUserId(1024);
    expect(v_2b9521.initSdk).not.toHaveBeenCalled();
    expect(v_2b9521.logEvent).not.toHaveBeenCalled();
    expect(v_2b9521.setCustomerUserId).not.toHaveBeenCalled();
  });

  it("Android 는 키만 있으면 초기화한다(appId 없음)", () => {
    const { mod: v_06a17d, sdk: v_2b9521 } = v_f6f5de({ key: "k" });
    v_06a17d.initAppsFlyer();
    v_06a17d.initAppsFlyer(); 
    expect(v_2b9521.initSdk).toHaveBeenCalledTimes(1);
    expect(v_2b9521.initSdk.mock.calls[0][0]).toMatchObject({ devKey: "k", appId: undefined });
  });

  it("iOS 는 App ID 가 없으면 건너뛴다", () => {
    const { mod: v_06a17d, sdk: v_2b9521 } = v_f6f5de({ key: "k" }, "ios");
    v_06a17d.initAppsFlyer();
    expect(v_2b9521.initSdk).not.toHaveBeenCalled();
  });

  it("iOS 는 App ID 가 있으면 함께 넘긴다", () => {
    const { mod: v_06a17d, sdk: v_2b9521 } = v_f6f5de({ key: "k", iosAppId: "6793993890" }, "ios");
    v_06a17d.initAppsFlyer();
    expect(v_2b9521.initSdk.mock.calls[0][0]).toMatchObject({ devKey: "k", appId: "6793993890" });
  });

  it("init 전에는 이벤트를 보내지 않는다", () => {
    const { mod: v_06a17d, sdk: v_2b9521 } = v_f6f5de({ key: "k" });
    v_06a17d.logAppsFlyerLogin("google");
    expect(v_2b9521.logEvent).not.toHaveBeenCalled();
  });

  it("로그인·가입·통화 영상 이벤트 이름과 값", () => {
    const { mod: v_06a17d, sdk: v_2b9521 } = v_f6f5de({ key: "k" });
    v_06a17d.initAppsFlyer();
    v_06a17d.setAppsFlyerUserId(1024);
    v_06a17d.logAppsFlyerLogin("google");
    v_06a17d.logAppsFlyerRegistration("email");
    v_06a17d.logAppsFlyerCallVideoStart(9183);
    expect(v_2b9521.setCustomerUserId).toHaveBeenCalledWith("1024");
    expect(v_2b9521.logEvent.mock.calls.map((v_3f4e2e) => [v_3f4e2e[0], v_3f4e2e[1]])).toEqual([
      ["af_login", { af_param_1: "google" }],
      ["af_complete_registration", { af_registration_method: "email" }],
      ["call_video_start", { af_content_id: "9183", af_content_type: "clone_call" }],
    ]);
  });

  it("web 에서는 아무것도 하지 않는다", () => {
    const { mod: v_06a17d, sdk: v_2b9521 } = v_f6f5de({ key: "k" }, "web");
    v_06a17d.initAppsFlyer();
    v_06a17d.logAppsFlyerCallVideoStart(1);
    expect(v_2b9521.initSdk).not.toHaveBeenCalled();
    expect(v_2b9521.logEvent).not.toHaveBeenCalled();
  });
});
