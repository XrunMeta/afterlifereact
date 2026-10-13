
export const v_d76390 = "create.voice.analyzing";
export const v_7218f6 = "create.voice.analyzeFailTitle";

const v_281ad7 = {
  TOO_SHORT: "create.voice.analyzeFailTooShort",
  NO_PAUSE: "create.voice.analyzeFailNoPause",
  NO_VOICE: "create.voice.analyzeFailNoVoice",
};

export function v_17fa33(v_58ca36): string {
  return (v_58ca36 && Object.prototype.hasOwnProperty.call(v_281ad7, v_58ca36) && v_281ad7[v_58ca36]) || "create.voice.analyzeFailGeneric";
}
