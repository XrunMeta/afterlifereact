

export function detectNewFaces(
  seen: Set<number>,
  trackingIds: number[]
): { newIds: number[]; seen: Set<number> } {
  const newIds = trackingIds.filter((id) => !seen.has(id));
  const nextSeen = newIds.length === 0 ? new Set(seen) : new Set([...seen, ...trackingIds]);
  return { newIds, seen: nextSeen };
}
