import { describe, it, expect, vi } from "vitest";
import { triggerPrebuild } from "../src/lib/prebuildClient";

describe("triggerPrebuild", () => {
  it("POSTs cloneId+voiceRawUrl with Bearer secret", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    await triggerPrebuild(fetchMock as any, {
      base: "https://memorial.example.invalid",
      secret: "s3cr3t",
      cloneId: "9099",
      voiceRawUrl: "https://x/oth-path",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://memorial.example.invalid/prethird/prebuild");
    expect(init.method).toBe("POST");
    expect(init.headers["Authorization"]).toBe("Bearer s3cr3t");
    expect(JSON.parse(init.body)).toEqual({ cloneId: "9099", voiceRawUrl: "https://x/oth-path" });
  });

  it("swallows errors (fire-and-forget, never throws)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    await expect(triggerPrebuild(fetchMock as any, {
      base: "https://memorial.example.invalid", secret: "s", cloneId: "9", voiceRawUrl: "u",
    })).resolves.toBeUndefined();
  });

  it("skips when voiceRawUrl is null", async () => {
    const fetchMock = vi.fn();
    await triggerPrebuild(fetchMock as any, {
      base: "https://memorial.example.invalid", secret: "s", cloneId: "9", voiceRawUrl: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
