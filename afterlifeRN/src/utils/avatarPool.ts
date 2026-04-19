import type { ImageSourcePropType } from "react-native";

const POOL: ImageSourcePropType[] = [
  require("../../assets/images/grandfather-avatar.png"),
  require("../../assets/images/grandmother-avatar.png"),
  require("../../assets/images/grandfather.jpg"),
  require("../../assets/images/grandmother.jpg"),
  require("../../assets/images/friend-male.jpg"),
  require("../../assets/images/friend-female.jpg"),
];

const COVER_POOL: ImageSourcePropType[] = [
  require("../../assets/images/grandfather-post.png"),
  require("../../assets/images/grandmother-post.png"),
];

function hashSeed(seed: string | number): number {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function resolveAvatar(opts: {
  url?: string | null;
  seed: string | number;
}): ImageSourcePropType {
  if (opts.url && opts.url.trim()) {
    return { uri: opts.url };
  }
  return POOL[hashSeed(opts.seed) % POOL.length];
}

export function resolveCover(opts: {
  url?: string | null;
  seed: string | number;
}): ImageSourcePropType {
  if (opts.url && opts.url.trim()) {
    return { uri: opts.url };
  }
  return COVER_POOL[hashSeed(opts.seed) % COVER_POOL.length];
}
