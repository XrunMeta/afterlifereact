

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

export const v_fac667 = {

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

export function v_0dbbd1(
  v_a13c2e,
  v_257132,
  v_8d41d7,
): VisemeWeights {
  const v_fa53ec = new Set<LipsyncBlendshape>([
    ...(Object.keys(v_a13c2e) as LipsyncBlendshape[]),
    ...(Object.keys(v_257132) as LipsyncBlendshape[]),
  ]);
  const v_8d4337 = {};
  for (const v_0eb677 of v_fa53ec) {
    const v_779914 = v_a13c2e[v_0eb677] ?? 0;
    const v_148ff6 = v_257132[v_0eb677] ?? 0;
    const v_81e2ef = v_779914 + (v_148ff6 - v_779914) * Math.max(0, Math.min(1, v_8d41d7));
    if (v_81e2ef > 0.001) v_8d4337[v_0eb677] = v_81e2ef;
  }
  return v_8d4337;
}

export function v_4a2086(
  v_e5c9ed,
  v_a893b0,
): number[] {
  return v_a893b0.map((v_1833e7) => {
    const v_81e2ef = v_e5c9ed[v_1833e7 as LipsyncBlendshape];
    return typeof v_81e2ef === "number" ? v_81e2ef : 0;
  });
}
