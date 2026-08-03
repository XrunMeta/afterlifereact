

export const T208_SILHOUETTE_SCALES = [0.75, 0.5, 0.4] as const;
export type T208SilhouetteScale = (typeof T208_SILHOUETTE_SCALES)[number];

export const DEFAULT_SILHOUETTE_SCALE = 0.75 as const;

const listeners = new Set<() => void>();

let measureMode = false;
let devScale: T208SilhouetteScale = DEFAULT_SILHOUETTE_SCALE;

function notify() {
  listeners.forEach((l) => l());
}

export function isT208MeasureMode(): boolean {
  return __DEV__ && measureMode;
}

export function setT208MeasureMode(on: boolean): void {
  if (!__DEV__) return;
  measureMode = on;
  if (on) {

    devScale = 0.75;
  } else {
    devScale = DEFAULT_SILHOUETTE_SCALE;
  }
  notify();
}

export function getSilhouetteScale(): number {
  if (!__DEV__) return DEFAULT_SILHOUETTE_SCALE;
  if (!measureMode) return DEFAULT_SILHOUETTE_SCALE;
  return devScale;
}

export function setSilhouetteScale(scale: T208SilhouetteScale): void {
  if (!__DEV__ || !measureMode) return;
  if (!(T208_SILHOUETTE_SCALES as readonly number[]).includes(scale)) return;
  devScale = scale;
  notify();
}

export function cycleSilhouetteScale(): T208SilhouetteScale {
  if (!__DEV__ || !measureMode) return DEFAULT_SILHOUETTE_SCALE;
  const idx = T208_SILHOUETTE_SCALES.indexOf(devScale);
  const next = T208_SILHOUETTE_SCALES[(idx < 0 ? 0 : idx + 1) % T208_SILHOUETTE_SCALES.length];
  setSilhouetteScale(next);
  return next;
}

export function subscribeSilhouetteScale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function silhouetteScaleLabel(scale: number = getSilhouetteScale()): string {
  if (scale === 0.75) return "1·큼(0.75)";
  if (scale === 0.4) return "3·작음(0.40)";
  if (scale === 0.5) return "2·중간(0.50)";
  return `배율(${scale})`;
}
