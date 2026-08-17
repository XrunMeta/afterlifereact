

export const secondsToMinutes = (v: unknown): string => `${Math.floor(Number(v) / 60)}분`;

export const raw = (v: unknown): string => String(v ?? "");
