

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@afterlifeRN/deviceId";

function generate(): string {

  const r1 = Math.random().toString(36).slice(2);
  const r2 = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${r1}${t}${r2}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const cached = await AsyncStorage.getItem(KEY);
  if (cached) return cached;
  const id = generate();
  await AsyncStorage.setItem(KEY, id);
  return id;
}
