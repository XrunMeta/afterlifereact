

import * as Location from 'expo-location';

const CALL_TIMEOUT_MS = 3500;
const POS_CACHE_MS = 5 * 60_000; 

type CachedPosition = { at: number; text: string | null };
let cache: CachedPosition | null = null;

export async function getUserLocationForCall(): Promise<string | null> {

  if (cache && Date.now() - cache.at < POS_CACHE_MS) {
    return cache.text;
  }

  try {
    return await Promise.race<string | null>([
      _resolveLocation(),
      new Promise<string | null>((resolve) => setTimeout(() => resolve(null), CALL_TIMEOUT_MS)),
    ]);
  } catch (e) {
    console.warn('[userLocation] resolve failed:', e);
    return null;
  }
}

async function _resolveLocation(): Promise<string | null> {

  let perm = await Location.getForegroundPermissionsAsync();
  if (!perm.granted && perm.status === 'undetermined' && perm.canAskAgain) {
    perm = await Location.requestForegroundPermissionsAsync();
  }
  if (!perm.granted) {
    cache = { at: Date.now(), text: null };
    return null;
  }

  const pos =
    (await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 100 })) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }));
  if (!pos?.coords) {
    cache = { at: Date.now(), text: null };
    return null;
  }

  const geo = await Location.reverseGeocodeAsync({
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  }).catch(() => []);
  const first = geo?.[0];
  if (!first) {
    cache = { at: Date.now(), text: null };
    return null;
  }

  console.log('[userLocation] geo fields:', JSON.stringify({
    city: first.city,
    country: first.country,
    district: first.district,
    name: first.name,
    postalCode: first.postalCode,
    region: first.region,
    street: first.street,
    streetNumber: first.streetNumber,
    subregion: first.subregion,
  }));

  const level1 = first.region;  

  const level2Candidates = [first.subregion, first.city]
    .filter((v): v is string => !!v && v !== level1);
  const level2 = level2Candidates[0] ?? null;

  const rawDistrict = first.district;
  const isValidDong = rawDistrict
    && !/^\d+동?$/.test(rawDistrict.trim())  
    && rawDistrict !== level1
    && rawDistrict !== level2;
  const level3 = isValidDong ? rawDistrict : null;

  const parts: string[] = [];
  if (level1) parts.push(level1);
  if (level2) parts.push(level2);
  if (level3) parts.push(level3);
  const text = parts.length ? parts.join(' ') : null;

  cache = { at: Date.now(), text };
  console.log('[userLocation] resolved:', text);
  return text;
}

export function clearUserLocationCache(): void {
  cache = null;
}
