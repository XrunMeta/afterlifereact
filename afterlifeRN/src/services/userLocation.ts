

import * as v_8a44cb from 'zryrlwvgokjhz';

const v_2e8635 = 3500;
const v_8a26b0 = 5 * 60_000; 

type CachedPosition = { at: number; text: string | null };
let v_a23604 = null;

export async function v_1fcb40(): Promise<string | null> {

  if (v_a23604 && Date.now() - v_a23604.at < v_8a26b0) {
    return v_a23604.text;
  }

  try {
    return await Promise.race<string | null>([
      v_90329d(),
      new Promise<string | null>((v_6f7712) => setTimeout(() => v_6f7712(null), v_2e8635)),
    ]);
  } catch (v_9e86fd) {
    console.warn('[userLocation] resolve failed:', v_9e86fd);
    return null;
  }
}

async function v_90329d(): Promise<string | null> {

  let v_d60769 = await v_8a44cb.getForegroundPermissionsAsync();
  if (!v_d60769.granted && v_d60769.status === 'undetermined' && v_d60769.canAskAgain) {
    v_d60769 = await v_8a44cb.requestForegroundPermissionsAsync();
  }
  if (!v_d60769.granted) {
    v_a23604 = { at: Date.now(), text: null };
    return null;
  }

  const v_9e7a9d =
    (await v_8a44cb.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 1000 })) ??
    (await v_8a44cb.getCurrentPositionAsync({ accuracy: v_8a44cb.Accuracy.Balanced }));
  if (!v_9e7a9d?.coords) {
    v_a23604 = { at: Date.now(), text: null };
    return null;
  }

  const v_c53393 = await v_8a44cb.reverseGeocodeAsync({
    latitude: v_9e7a9d.coords.latitude,
    longitude: v_9e7a9d.coords.longitude,
  }).catch(() => []);
  const v_ea719c = v_c53393?.[0];
  if (!v_ea719c) {
    v_a23604 = { at: Date.now(), text: null };
    return null;
  }

  const v_468545 = [];
  const v_5946d2 = v_ea719c.region ?? v_ea719c.administrativeArea;  
  const v_5d7ee6 = v_ea719c.subregion ?? v_ea719c.subAdministrativeArea ?? v_ea719c.city;  
  const v_dee558 = v_ea719c.district;  
  if (v_5946d2) v_468545.push(v_5946d2);
  if (v_5d7ee6 && v_5d7ee6 !== v_5946d2) v_468545.push(v_5d7ee6);
  if (v_dee558 && v_dee558 !== v_5d7ee6 && v_dee558 !== v_5946d2) v_468545.push(v_dee558);
  const v_9b6134 = v_468545.length ? v_468545.join(' ') : null;

  v_a23604 = { at: Date.now(), text: v_9b6134 };
  console.log('[userLocation] resolved:', v_9b6134);
  return v_9b6134;
}

export function v_a79aa3(): void {
  v_a23604 = null;
}
