

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_ASKED_DATE_KEY = '@afterlifeRN/userLocation/askedDate/v2';
const LOCATION_ASKED_DATE_KEY_LEGACY_V1 = '@afterlifeRN/userLocation/askedDate';

function todayKstDate(): string {
  const now = Date.now();
  const kst = new Date(now + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

const CALL_TIMEOUT_MS = 6000;
const POS_CACHE_MS = 5 * 60_000; 

type CachedPosition = { at: number; text: string | null };
let cache: CachedPosition | null = null;

export interface UserLocationResult {

  location: string | null;

  askIntro: boolean;
}

export async function getUserLocationForCall(cloneId?: number): Promise<UserLocationResult> {
  let text: string | null = null;
  if (cache && Date.now() - cache.at < POS_CACHE_MS) {
    text = cache.text;
  } else {
    try {
      text = await Promise.race<string | null>([
        _resolveLocation(),
        new Promise<string | null>((resolve) => setTimeout(() => resolve(null), CALL_TIMEOUT_MS)),
      ]);
    } catch (e) {
      console.warn('[userLocation] resolve failed:', e);
      return { location: null, askIntro: false };
    }
  }

  if (!text) return { location: null, askIntro: false };

  const currentKey = cloneId != null
    ? `${todayKstDate()}|c${cloneId}|${text}`
    : `${todayKstDate()}|${text}`;
  let askIntro = true;
  try {
    const askedKey = await AsyncStorage.getItem(LOCATION_ASKED_DATE_KEY);
    if (askedKey === currentKey) {
      console.log(`[userLocation] askIntro=false — 오늘 이미 clone=${cloneId ?? '?'} 에 인사함: ${text}`);
      askIntro = false;
    }
  } catch {  }

  if (askIntro) {
    try {
      await AsyncStorage.setItem(LOCATION_ASKED_DATE_KEY, currentKey);
    } catch {  }
  }
  return { location: text, askIntro };
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

  const dongPattern = /^[가-힣]+\d*(동|읍|면)$/;
  const isValidDong = (v: string | null | undefined): v is string =>
    !!v && dongPattern.test(v.trim()) && v !== level1 && v !== level2;
  const level3 =
    (isValidDong(first.district) ? first.district : null) ??
    (isValidDong(first.street) ? first.street : null) ??
    null;

  const parts: string[] = [];
  if (level1) parts.push(level1);
  if (level2) parts.push(level2);
  if (level3) parts.push(level3);
  let text = parts.length ? parts.join(' ') : null;

  if (!level2 && level1 && (level3 || pos.coords)) {
    try {
      const nom = await _nominatimReverse(pos.coords.latitude, pos.coords.longitude);
      if (nom) {
        console.log('[userLocation] nominatim boost:', nom);

        const boostedParts: string[] = [];
        if (nom.city) boostedParts.push(nom.city);
        if (nom.gu && nom.gu !== nom.city) boostedParts.push(nom.gu);
        if (nom.dong && nom.dong !== nom.gu && nom.dong !== nom.city) boostedParts.push(nom.dong);
        if (boostedParts.length > parts.length) {
          text = boostedParts.join(' ');
        }
      }
    } catch (err) {
      console.warn('[userLocation] nominatim boost failed:', err);
    }
  }

  cache = { at: Date.now(), text };
  console.log('[userLocation] resolved:', text);
  return text;
}

async function _nominatimReverse(
  lat: number,
  lng: number,
): Promise<{ city: string | null; gu: string | null; dong: string | null } | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=ko&zoom=16`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AfterLife/1.0 (oth-staff@example.invalid)' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { address?: Record<string, string> };
    const a = json.address ?? {};

    const city = a.city ?? a.province ?? null;
    const gu = a.borough ?? a.city_district ?? a.county ?? a.district ?? null;
    const dong = a.suburb ?? a.neighbourhood ?? a.quarter ?? null;
    return { city, gu, dong };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function clearUserLocationCache(): void {
  cache = null;
}

AsyncStorage.removeItem(LOCATION_ASKED_DATE_KEY_LEGACY_V1).catch(() => {});
