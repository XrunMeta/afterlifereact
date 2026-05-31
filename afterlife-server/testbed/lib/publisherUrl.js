

export function resolvePublisherUrl(publisherPort, defaultUrl) {
  const p = Number(publisherPort);
  if (!Number.isInteger(p) || p < 1 || p > 65535) return defaultUrl;
  return `http://127.0.0.1:${p}`;
}
