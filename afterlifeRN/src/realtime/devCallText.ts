

export function submitDevText(
  text: string,
  say: (text: string) => Promise<void> | void,
  setText: (value: string) => void,
): void {
  const trimmed = text.trim();
  if (!trimmed) return; 

  Promise.resolve(say(trimmed)).catch(() => {});
  setText(""); 
}
