

export const v_7def33 = [
  "mp3",
  "m4a",
  "mp4",
  "aac",
  "wav",
  "wave",
  "ogg",
  "oga",
  "opus",
  "flac",
  "aiff",
  "aif",
  "caf",
  "amr",
  "wma",
] as const;

export type AudioCheckReason = "empty" | "extension" | "magic";

export interface AudioCheckResult {
  ok: boolean;
  reason?: AudioCheckReason;
}

export function v_214ff9(v_1833e7): string {
  if (!v_1833e7) return "";
  const v_801ce6 = v_1833e7.lastIndexOf(".");
  if (v_801ce6 < 0 || v_801ce6 === v_1833e7.length - 1) return "";
  return v_1833e7.slice(v_801ce6 + 1).toLowerCase();
}

export function v_aa1f48(v_1833e7): boolean {
  const v_40a923 = v_214ff9(v_1833e7);
  return (v_7def33 as readonly string[]).includes(v_40a923);
}

export function v_cc6e14(v_b66751): boolean {
  if (!v_b66751) return false;
  const v_35f85c = v_b66751.toLowerCase();
  return v_35f85c.startsWith("audio/") || v_35f85c === "application/ogg" || v_35f85c === "video/mp4";
}

function v_8f0374(v_fbb6da, v_965edf, v_fe889f): string {
  let v_fd5f43 = "";
  for (let v_ebec57 = v_965edf; v_ebec57 < v_965edf + v_fe889f && v_ebec57 < v_fbb6da.length; v_ebec57++) v_fd5f43 += String.fromCharCode(v_fbb6da[v_ebec57]);
  return v_fd5f43;
}

export function v_f8ff8a(v_fbb6da): boolean {
  if (v_fbb6da.length < 4) return false;

  if (v_8f0374(v_fbb6da, 0, 3) === "ID3") return true;
  if (v_fbb6da[0] === 0xff && (v_fbb6da[1] & 0xe0) === 0xe0) return true;

  if (v_8f0374(v_fbb6da, 0, 4) === "RIFF" && v_8f0374(v_fbb6da, 8, 4) === "WAVE") return true;

  if (v_8f0374(v_fbb6da, 4, 4) === "ftyp") return true;

  if (v_8f0374(v_fbb6da, 0, 4) === "OggS") return true;

  if (v_8f0374(v_fbb6da, 0, 4) === "fLaC") return true;

  if (v_8f0374(v_fbb6da, 0, 4) === "FORM") {
    const v_94302c = v_8f0374(v_fbb6da, 8, 4);
    if (v_94302c === "AIFF" || v_94302c === "AIFC") return true;
  }

  if (v_8f0374(v_fbb6da, 0, 4) === "caff") return true;

  if (v_8f0374(v_fbb6da, 0, 5) === "#!AMR") return true;

  if (v_fbb6da[0] === 0xff && (v_fbb6da[1] === 0xf1 || v_fbb6da[1] === 0xf9)) return true;

  if (v_fbb6da[0] === 0x30 && v_fbb6da[1] === 0x26 && v_fbb6da[2] === 0xb2 && v_fbb6da[3] === 0x75) return true;

  return false;
}

export function v_878cce(v_8a9589): Uint8Array {
  const v_76a373 = v_8a9589.replace(/[^A-Za-z0-9+/]/g, "");
  const v_cb9428 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const v_8d4337 = [];
  let v_062bb0 = 0;
  let v_fb19c6 = 0;
  for (const v_10a17d of v_76a373) {
    const v_e86ad8 = v_cb9428.indexOf(v_10a17d);
    if (v_e86ad8 < 0) continue;
    v_062bb0 = (v_062bb0 << 6) | v_e86ad8;
    v_fb19c6 += 6;
    if (v_fb19c6 >= 8) {
      v_fb19c6 -= 8;
      v_8d4337.push((v_062bb0 >> v_fb19c6) & 0xff);
    }
  }
  return Uint8Array.from(v_8d4337);
}

export async function v_da71d6(v_cd1446): Promise<boolean | null> {
  try {
    const v_8f00b9 = await fetch(v_cd1446);
    const v_3263c7 = await v_8f00b9.blob();
    if (!v_3263c7 || v_3263c7.size === 0) return false;
    const v_43fb07 = v_3263c7.slice(0, 16);
    const v_b98fb4 = await new Promise((v_6f7712, v_bad6f3) => {

      const v_f47a40 = new FileReader();
      v_f47a40.onerror = () => v_bad6f3(v_f47a40.error);
      v_f47a40.onload = () => v_6f7712(String(v_f47a40.result ?? ""));
      v_f47a40.readAsDataURL(v_43fb07 as Blob);
    });
    const v_67506c = v_b98fb4.indexOf(",");
    if (v_67506c < 0) return null;
    return v_f8ff8a(v_878cce(v_b98fb4.slice(v_67506c + 1)));
  } catch {

    return null;
  }
}

export async function v_6c761f(v_bbda62): Promise<AudioCheckResult> {
  if (v_bbda62.size != null && v_bbda62.size <= 0) return { ok: false, reason: "empty" };

  if (!v_cc6e14(v_bbda62.mimeType) && !v_aa1f48(v_bbda62.name)) {
    return { ok: false, reason: "extension" };
  }

  const v_b7264f = await v_da71d6(v_bbda62.uri);
  if (v_b7264f === false) return { ok: false, reason: "magic" };
  return { ok: true };
}
