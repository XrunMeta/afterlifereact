

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
    (await v_8a44cb.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 100 })) ??
    (await v_8a44cb.getCurrentPositionAsync({ accuracy: v_8a44cb.Accuracy.High }));
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

  console.log('[userLocation] geo fields:', JSON.stringify({
    city: v_ea719c.city,
    country: v_ea719c.country,
    district: v_ea719c.district,
    name: v_ea719c.name,
    postalCode: v_ea719c.postalCode,
    region: v_ea719c.region,
    street: v_ea719c.street,
    streetNumber: v_ea719c.streetNumber,
    subregion: v_ea719c.subregion,
  }));

  const v_5946d2 = v_ea719c.region;  

  const v_fcd2a8 = [v_ea719c.subregion, v_ea719c.city]
    .filter((v_81e2ef): v_81e2ef is string => !!v_81e2ef && v_81e2ef !== v_5946d2);
  const v_5d7ee6 = v_fcd2a8[0] ?? null;

  const v_267df8 = /^[가-힣]+\d*(동|읍|면)$/;
  const v_21e964 = (v_81e2ef): v_81e2ef is string =>
    !!v_81e2ef && v_267df8.test(v_81e2ef.trim()) && v_81e2ef !== v_5946d2 && v_81e2ef !== v_5d7ee6;
  const v_dee558 =
    (v_21e964(v_ea719c.district) ? v_ea719c.district : null) ??
    (v_21e964(v_ea719c.street) ? v_ea719c.street : null) ??
    null;

  const v_468545 = [];
  if (v_5946d2) v_468545.push(v_5946d2);
  if (v_5d7ee6) v_468545.push(v_5d7ee6);
  if (v_dee558) v_468545.push(v_dee558);
  let v_9b6134 = v_468545.length ? v_468545.join(' ') : null;

  if (!v_5d7ee6 && v_5946d2 && (v_dee558 || v_9e7a9d.coords)) {
    try {
      const v_ecac79 = await v_dd036c(v_9e7a9d.coords.latitude, v_9e7a9d.coords.longitude);
      if (v_ecac79) {
        console.log('[userLocation] nominatim boost:', v_ecac79);

        const v_efd638 = [];
        if (v_ecac79.city) v_efd638.push(v_ecac79.city);
        if (v_ecac79.gu && v_ecac79.gu !== v_ecac79.city) v_efd638.push(v_ecac79.gu);
        if (v_ecac79.dong && v_ecac79.dong !== v_ecac79.gu && v_ecac79.dong !== v_ecac79.city) v_efd638.push(v_ecac79.dong);
        if (v_efd638.length > v_468545.length) {
          v_9b6134 = v_efd638.join(' ');
        }
      }
    } catch (v_49263d) {
      console.warn('[userLocation] nominatim boost failed:', v_49263d);
    }
  }

  v_a23604 = { at: Date.now(), text: v_9b6134 };
  console.log('[userLocation] resolved:', v_9b6134);
  return v_9b6134;
}

async function v_dd036c(
  v_e1b1cf,
  v_c87b30,
): Promise<{ city: string | null; gu: string | null; dong: string | null } | null> {
  const v_f71b56 = `https://nominatim.openstreetmap.org/reverse?lat=${v_e1b1cf}&lon=${v_c87b30}&format=json&addressdetails=1&accept-language=ko&zoom=16`;
  const v_4fc7c7 = new AbortController();
  const v_3894d5 = setTimeout(() => v_4fc7c7.abort(), 2500);
  try {
    const v_8f00b9 = await fetch(v_f71b56, {
      headers: { 'User-Agent': 'AfterLife/1.0 (oth-staff@example.invalid)' },
      signal: v_4fc7c7.signal,
    });
    if (!v_8f00b9.ok) return null;
    const v_7ecfd1 = (await v_8f00b9.json()) as { address?: Record<string, string> };
    const v_779914 = v_7ecfd1.address ?? {};

    const v_db80cc = v_779914.city ?? v_779914.province ?? null;
    const v_40b84e = v_779914.borough ?? v_779914.city_district ?? v_779914.county ?? v_779914.district ?? null;
    const v_7888b9 = v_779914.suburb ?? v_779914.neighbourhood ?? v_779914.quarter ?? null;
    return { city: v_db80cc, gu: v_40b84e, dong: v_7888b9 };
  } catch {
    return null;
  } finally {
    clearTimeout(v_3894d5);
  }
}

export function v_a79aa3(): void {
  v_a23604 = null;
}
