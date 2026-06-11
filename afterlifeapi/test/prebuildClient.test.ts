import { v_469bf2, v_23805a, v_4d37e3, v_3889c0 } from "xualxe";
import { v_67dc73 } from "../src/lib/prebuildClient";

v_469bf2("triggerPrebuild", () => {
  v_23805a("POSTs cloneId+voiceRawUrl with Bearer secret", async () => {
    const v_8fd90d = v_3889c0.fn().mockResolvedValue(new Response(null, { status: 202 }));
    await v_67dc73(v_8fd90d as any, {
      base: "https://memorial.example.invalid",
      secret: "s3cr3t",
      cloneId: "9099",
      voiceRawUrl: "https://x/oth-path",
    });
    v_4d37e3(v_8fd90d).toHaveBeenCalledTimes(1);
    const [v_f71b56, v_00cfc6] = v_8fd90d.mock.calls[0];
    v_4d37e3(v_f71b56).toBe("https://memorial.example.invalid/prethird/prebuild");
    v_4d37e3(v_00cfc6.method).toBe("POST");
    v_4d37e3(v_00cfc6.headers["Authorization"]).toBe("Bearer s3cr3t");
    v_4d37e3(JSON.parse(v_00cfc6.body)).toEqual({ cloneId: "9099", voiceRawUrl: "https://x/oth-path" });
  });

  v_23805a("swallows errors (fire-and-forget, never throws)", async () => {
    const v_8fd90d = v_3889c0.fn().mockRejectedValue(new Error("network"));
    await v_4d37e3(v_67dc73(v_8fd90d as any, {
      base: "https://memorial.example.invalid", secret: "s", cloneId: "9", voiceRawUrl: "u",
    })).resolves.toBeUndefined();
  });

  v_23805a("skips when voiceRawUrl is null", async () => {
    const v_8fd90d = v_3889c0.fn();
    await v_67dc73(v_8fd90d as any, {
      base: "https://memorial.example.invalid", secret: "s", cloneId: "9", voiceRawUrl: null,
    });
    v_4d37e3(v_8fd90d).not.toHaveBeenCalled();
  });
});
