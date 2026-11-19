import { v_469bf2, v_23805a, v_4d37e3, v_3889c0, v_719203 } from "xualxe";
import { v_ec7e95, v_7a8165, v_291582 } from "../src/lib/gabiaVoiceSync";

v_469bf2("isVoicePresetSyncRequired", () => {
  v_23805a('"1" 이면 true', () => {
    v_4d37e3(v_291582({ VOICE_PRESET_SYNC_REQUIRED: "1" })).toBe(true);
  });
  v_23805a('"0" 이면 false', () => {
    v_4d37e3(v_291582({ VOICE_PRESET_SYNC_REQUIRED: "0" })).toBe(false);
  });
  v_23805a("undefined 이면 false (기본 off)", () => {
    v_4d37e3(v_291582({})).toBe(false);
  });
  v_23805a("임의 문자열은 false — strict 비교", () => {
    v_4d37e3(v_291582({ VOICE_PRESET_SYNC_REQUIRED: "yes" })).toBe(false);
    v_4d37e3(v_291582({ VOICE_PRESET_SYNC_REQUIRED: "true" })).toBe(false);
    v_4d37e3(v_291582({ VOICE_PRESET_SYNC_REQUIRED: " 1" })).toBe(false);
  });
});

v_469bf2("generateSeKey", () => {
  v_23805a("preset- prefix + 영숫자만", () => {
    const v_0eb677 = v_ec7e95();
    v_4d37e3(v_0eb677).toMatch(/^preset-[a-z0-9]+$/);
  });

  v_23805a("호출마다 유니크", () => {
    const v_110a8b = new Set<string>();
    for (let v_ebec57 = 0; v_ebec57 < 20; v_ebec57++) v_110a8b.add(v_ec7e95());
    v_4d37e3(v_110a8b.size).toBe(20);
  });

  v_23805a("최대 120자 이내 (가비아 _SE_KEY_RE 호환)", () => {
    const v_0eb677 = v_ec7e95();
    v_4d37e3(v_0eb677.length).toBeLessThanOrEqual(120);
    v_4d37e3(v_0eb677.length).toBeGreaterThan(7); 
  });
});

v_469bf2("uploadPresetToGabia", () => {
  const v_b3b34c = {
    CALL_PRETHIRD_BASE: "https://rtc.example.invalid/prethird",
    LEARN_SECRET: "test-secret",
  };
  const v_fbb6da = new Uint8Array([1, 2, 3, 4]).buffer;

  v_719203(() => {
    v_3889c0.restoreAllMocks();
  });

  v_23805a("LEARN_SECRET 미설정 시 learn-secret-missing", async () => {
    const v_cb35cb = await v_7a8165(
      { CALL_PRETHIRD_BASE: "x", LEARN_SECRET: "" },
      "preset-abc",
      v_fbb6da,
      "audio/wav",
    );
    v_4d37e3(v_cb35cb.ok).toBe(false);
    if (!v_cb35cb.ok) v_4d37e3(v_cb35cb.reason).toBe("learn-secret-missing");
  });

  v_23805a("CALL_PRETHIRD_BASE 미설정 시 prethird-base-missing", async () => {
    const v_cb35cb = await v_7a8165(
      { CALL_PRETHIRD_BASE: "", LEARN_SECRET: "s" },
      "preset-abc",
      v_fbb6da,
      "audio/wav",
    );
    v_4d37e3(v_cb35cb.ok).toBe(false);
    if (!v_cb35cb.ok) v_4d37e3(v_cb35cb.reason).toBe("prethird-base-missing");
  });

  v_23805a("가비아 200 응답 → ok:true", async () => {
    v_3889c0.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ok: true, path: "/root/ref_voices/preset-abc/voice.wav", bytes: 4 }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const v_cb35cb = await v_7a8165(v_b3b34c, "preset-abc", v_fbb6da, "audio/wav");
    v_4d37e3(v_cb35cb.ok).toBe(true);
    if (v_cb35cb.ok) {
      v_4d37e3(v_cb35cb.path).toContain("preset-abc");
      v_4d37e3(v_cb35cb.bytes).toBe(4);
    }
  });

  v_23805a("호출 시 올바른 URL + X-Admin-Secret 헤더 + multipart body", async () => {
    const v_06e671 = v_3889c0.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, path: "/x", bytes: 4 }), { status: 200 }),
    );
    await v_7a8165(v_b3b34c, "preset-xyz", v_fbb6da, "audio/mp3");
    v_4d37e3(v_06e671).toHaveBeenCalledTimes(1);
    const [v_f71b56, v_00cfc6] = v_06e671.mock.calls[0]!;
    v_4d37e3(String(v_f71b56)).toBe("https://rtc.example.invalid/prethird/admin/preset-upload");
    const v_3f4675 = new Headers((v_00cfc6 as RequestInit).headers as HeadersInit);
    v_4d37e3(v_3f4675.get("x-admin-secret")).toBe("test-secret");
    const v_4d33b2 = (v_00cfc6 as RequestInit).body;
    v_4d37e3(v_4d33b2).toBeInstanceOf(FormData);
    const v_ebd523 = v_4d33b2 as FormData;
    v_4d37e3(v_ebd523.get("se_key")).toBe("preset-xyz");
    const v_cd2ac0 = v_ebd523.get("file");
    v_4d37e3(v_cd2ac0).toBeTruthy();

    v_4d37e3(v_cd2ac0).toBeInstanceOf(Blob);
  });

  v_23805a("가비아 500 실패 → ok:false + reason 에 에러 포함", async () => {
    v_3889c0.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "ffmpeg failed: boom" }), { status: 500 }),
    );
    const v_cb35cb = await v_7a8165(v_b3b34c, "preset-bad", v_fbb6da, "audio/wav");
    v_4d37e3(v_cb35cb.ok).toBe(false);
    if (!v_cb35cb.ok) {
      v_4d37e3(v_cb35cb.status).toBe(500);
      v_4d37e3(v_cb35cb.reason).toContain("ffmpeg");
    }
  });

  v_23805a("가비아 401 → ok:false + reason=unauthorized", async () => {
    v_3889c0.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
    );
    const v_cb35cb = await v_7a8165(v_b3b34c, "preset-u", v_fbb6da, "audio/wav");
    v_4d37e3(v_cb35cb.ok).toBe(false);
    if (!v_cb35cb.ok) {
      v_4d37e3(v_cb35cb.status).toBe(401);
      v_4d37e3(v_cb35cb.reason).toContain("unauthorized");
    }
  });

  v_23805a("AbortError → reason=timeout", async () => {
    v_3889c0.spyOn(globalThis, "fetch").mockImplementationOnce(() => {
      const v_49263d = new Error("aborted");
      (v_49263d as Error & { name: string }).name = "AbortError";
      throw v_49263d;
    });
    const v_cb35cb = await v_7a8165(v_b3b34c, "preset-t", v_fbb6da, "audio/wav");
    v_4d37e3(v_cb35cb.ok).toBe(false);
    if (!v_cb35cb.ok) v_4d37e3(v_cb35cb.reason).toBe("timeout");
  });

  v_23805a("일반 예외 → reason 에 메시지", async () => {
    v_3889c0.spyOn(globalThis, "fetch").mockImplementationOnce(() => {
      throw new Error("network down");
    });
    const v_cb35cb = await v_7a8165(v_b3b34c, "preset-e", v_fbb6da, "audio/wav");
    v_4d37e3(v_cb35cb.ok).toBe(false);
    if (!v_cb35cb.ok) {
      v_4d37e3(v_cb35cb.reason).toContain("network down");
      v_4d37e3(v_cb35cb.status).toBe(0);
    }
  });

  v_23805a("응답이 JSON 이 아니어도 crash 안 함", async () => {
    v_3889c0.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html>Bad Gateway</html>", { status: 502 }),
    );
    const v_cb35cb = await v_7a8165(v_b3b34c, "preset-bg", v_fbb6da, "audio/wav");
    v_4d37e3(v_cb35cb.ok).toBe(false);
    if (!v_cb35cb.ok) {
      v_4d37e3(v_cb35cb.status).toBe(502);
    }
  });
});
