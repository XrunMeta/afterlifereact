

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
  if (!perm.granted && perm.canAskAgain) {
    perm = await Location.requestForegroundPermissionsAsync();
  }
  if (!perm.granted) {
    cache = { at: Date.now(), text: null };
    return null;
  }

  const pos =
    (await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 1000 })) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
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

  const parts: string[] = [];
  const city = first.city ?? first.region ?? first.administrativeArea;
  const district = first.district ?? first.subregion ?? first.subAdministrativeArea;
  const dong = first.name ?? first.street;
  if (city) parts.push(city);
  if (district && district !== city) parts.push(district);
  if (dong && dong !== district && dong !== city) parts.push(dong);
  const text = parts.length ? parts.join(' ') : null;

  cache = { at: Date.now(), text };
  console.log('[userLocation] resolved:', text);
  return text;
}

export function clearUserLocationCache(): void {
  cache = null;
}
