

export type ExperimentalPipeline = "echomimic_v3" | "viseme_playback" | "threed";

let _next: ExperimentalPipeline | null = null;

export function setNextPipeline(p: ExperimentalPipeline | null): void {
  _next = p;
}

export function popNextPipeline(): ExperimentalPipeline | null {
  const v = _next;
  _next = null;
  return v;
}
