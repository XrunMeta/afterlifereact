

export const AUDIO_EXTENSIONS = [
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

export function extensionOf(name: string | null | undefined): string {
  if (!name) return "";
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

export function hasAudioExtension(name: string | null | undefined): boolean {
  const ext = extensionOf(name);
  return (AUDIO_EXTENSIONS as readonly string[]).includes(ext);
}

export function isAudioMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  const m = mime.toLowerCase();
  return m.startsWith("audio/") || m === "application/ogg" || m === "video/mp4";
}

function ascii(bytes: Uint8Array, start: number, len: number): string {
  let s = "";
  for (let i = start; i < start + len && i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

export function matchesAudioMagic(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;

  if (ascii(bytes, 0, 3) === "ID3") return true;
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return true;

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") return true;

  if (ascii(bytes, 4, 4) === "ftyp") return true;

  if (ascii(bytes, 0, 4) === "OggS") return true;

  if (ascii(bytes, 0, 4) === "fLaC") return true;

  if (ascii(bytes, 0, 4) === "FORM") {
    const kind = ascii(bytes, 8, 4);
    if (kind === "AIFF" || kind === "AIFC") return true;
  }

  if (ascii(bytes, 0, 4) === "caff") return true;

  if (ascii(bytes, 0, 5) === "#!AMR") return true;

  if (bytes[0] === 0xff && (bytes[1] === 0xf1 || bytes[1] === 0xf9)) return true;

  if (bytes[0] === 0x30 && bytes[1] === 0x26 && bytes[2] === 0xb2 && bytes[3] === 0x75) return true;

  return false;
}

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const idx = table.indexOf(ch);
    if (idx < 0) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

export async function sniffAudioMagic(uri: string): Promise<boolean | null> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    if (!blob || blob.size === 0) return false;
    const head = blob.slice(0, 16);
    const dataUrl: string = await new Promise((resolve, reject) => {

      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.readAsDataURL(head as Blob);
    });
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return null;
    return matchesAudioMagic(base64ToBytes(dataUrl.slice(comma + 1)));
  } catch {

    return null;
  }
}

export async function verifyAudioFile(input: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
}): Promise<AudioCheckResult> {
  if (input.size != null && input.size <= 0) return { ok: false, reason: "empty" };

  if (!isAudioMime(input.mimeType) && !hasAudioExtension(input.name)) {
    return { ok: false, reason: "extension" };
  }

  const sniffed = await sniffAudioMagic(input.uri);
  if (sniffed === false) return { ok: false, reason: "magic" };
  return { ok: true };
}
