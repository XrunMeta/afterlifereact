

export type Viseme =
  | "REST"  
  | "A"     
  | "E"     
  | "I"     
  | "O"     
  | "U"     
  | "EO"    
  | "EU"    
  | "BILAB" 
  | "DENT"; 

export type LipsyncBlendshape =
  | "jawOpen"
  | "jawForward"
  | "mouthClose"
  | "mouthFunnel"
  | "mouthPucker"
  | "mouthSmileLeft"
  | "mouthSmileRight"
  | "mouthStretchLeft"
  | "mouthStretchRight"
  | "mouthRollUpper"
  | "mouthRollLower"
  | "mouthUpperUpLeft"
  | "mouthUpperUpRight"
  | "mouthPressLeft"
  | "mouthPressRight";

export type VisemeWeights = Partial<Record<LipsyncBlendshape, number>>;

export const VISEME_TO_BLENDSHAPE: Readonly<Record<Viseme, VisemeWeights>> = {

  REST: {},

  A: {
    jawOpen: 0.75,
  },

  E: {
    jawOpen: 0.35,
    mouthSmileLeft: 0.3,
    mouthSmileRight: 0.3,
    mouthStretchLeft: 0.2,
    mouthStretchRight: 0.2,
  },

  I: {
    jawOpen: 0.15,
    mouthSmileLeft: 0.5,
    mouthSmileRight: 0.5,
    mouthStretchLeft: 0.5,
    mouthStretchRight: 0.5,
    mouthUpperUpLeft: 0.2,
    mouthUpperUpRight: 0.2,
  },

  O: {
    jawOpen: 0.4,
    mouthFunnel: 0.65,
  },

  U: {
    jawOpen: 0.2,
    mouthPucker: 0.75,
    mouthFunnel: 0.3,
  },

  EO: {
    jawOpen: 0.5,
    mouthRollLower: 0.15,
  },

  EU: {
    jawOpen: 0.15,
    mouthStretchLeft: 0.3,
    mouthStretchRight: 0.3,
  },

  BILAB: {
    mouthClose: 1.0,
    mouthPressLeft: 0.7,
    mouthPressRight: 0.7,
  },

  DENT: {
    jawOpen: 0.2,
    mouthStretchLeft: 0.3,
    mouthStretchRight: 0.3,
    mouthUpperUpLeft: 0.4,
    mouthUpperUpRight: 0.4,
  },
};

export function lerpVisemeWeights(
  from: VisemeWeights,
  to: VisemeWeights,
  t: number,
): VisemeWeights {
  const keys = new Set<LipsyncBlendshape>([
    ...(Object.keys(from) as LipsyncBlendshape[]),
    ...(Object.keys(to) as LipsyncBlendshape[]),
  ]);
  const out: VisemeWeights = {};
  for (const k of keys) {
    const a = from[k] ?? 0;
    const b = to[k] ?? 0;
    const v = a + (b - a) * Math.max(0, Math.min(1, t));
    if (v > 0.001) out[k] = v;
  }
  return out;
}

export function toMorphArray(
  weights: VisemeWeights,
  morphNames: readonly string[],
): number[] {
  return morphNames.map((name) => {
    const v = weights[name as LipsyncBlendshape];
    return typeof v === "number" ? v : 0;
  });
}
