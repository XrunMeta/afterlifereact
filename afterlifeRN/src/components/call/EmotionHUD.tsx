

import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_472849, v_326be8 } from 'rcmrninabrnb';

const v_671f54 = v_326be8.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const v_eb24c7 = {
  neutral: { label: '평소', emoji: '😐', color: '#e5e7eb' },
  calm: { label: '차분', emoji: '😌', color: '#93c5fd' },
  happy: { label: '기쁨', emoji: '😄', color: '#fde047' },
  sad: { label: '슬픔', emoji: '😢', color: '#a5b4fc' },
  angry: { label: '화남', emoji: '😠', color: '#f87171' },
  warm: { label: '다정', emoji: '🥰', color: '#f9a8d4' },
};

export function v_88b4fc(v_1842ef): { label: string; emoji: string; color: string } {
  if (!v_1842ef) return { label: '—', emoji: '', color: '#9ca3af' };
  return v_eb24c7[v_1842ef] ?? { label: v_1842ef, emoji: '❔', color: '#e5e7eb' };
}

export const EmotionHUD: v_a3453e.FC<{ emotion: string | null; top: number }> = ({ emotion: v_1842ef, top: v_fbc0a4 }) => {
  const v_d5dda0 = v_88b4fc(v_1842ef);
  return (
    <View style={[v_d81136.box, { top: v_fbc0a4 }]} pointerEvents="none" accessibilityLabel="dev-emotion-hud">
      <Text style={v_d81136.title}>감정</Text>
      <Text style={[v_d81136.value, { color: v_d5dda0.color }]}>
        {v_d5dda0.emoji ? `${v_d5dda0.emoji} ` : ''}{v_d5dda0.label}{v_1842ef && v_eb24c7[v_1842ef] ? ` · ${v_1842ef}` : ''}
      </Text>
    </View>
  );
};

const v_d81136 = v_472849.create({

  box: {
    position: 'absolute', alignSelf: 'center', zIndex: 31,
    backgroundColor: 'rgba(0,0,0,0.78)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center',
  },
  title: { color: '#22d3ee', fontSize: 9, fontFamily: v_671f54 },
  value: { fontSize: 13, fontWeight: '700' },
});
