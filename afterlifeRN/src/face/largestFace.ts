

export interface FaceBoundsLike {
  bounds: { width: number; height: number; x: number; y: number };
  trackingId?: number;
}

export function largestFace<T extends FaceBoundsLike>(faces: T[]): T | null {
  'worklet';
  if (faces.length === 0) return null;
  let best = faces[0];
  let bestArea = best.bounds.width * best.bounds.height;
  for (let i = 1; i < faces.length; i++) {
    const area = faces[i].bounds.width * faces[i].bounds.height;
    if (area > bestArea) {
      best = faces[i];
      bestArea = area;
    }
  }
  return best;
}
