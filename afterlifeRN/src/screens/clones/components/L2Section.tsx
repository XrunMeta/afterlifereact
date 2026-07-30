import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_472849 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';

interface Props {
  memoryCount: number;
  lastUpdatedAt: string | null;
}

export function v_193b22({ memoryCount: v_9882a9, lastUpdatedAt: v_c7b836 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  return (
    <View style={v_d81136.root}>
      <Text style={v_d81136.title}>{v_8d41d7('edit.l2SectionTitle', { defaultValue: '심화 기억 (L2) — 자동 학습' })}</Text>
      <Text style={v_d81136.body}>{v_8d41d7('edit.l2MemoryCount', { n: v_9882a9, defaultValue: '{{n}}개의 기억이 누적되어 있어요.' })}</Text>
      {v_c7b836 && (
        <Text accessibilityLabel="l2-last-updated" style={v_d81136.meta}>
          {v_8d41d7('edit.l2LastUpdated', { date: new Date(v_c7b836).toLocaleString(), defaultValue: '마지막 업데이트: {{date}}' })}
        </Text>
      )}
      <Text style={v_d81136.hint}>
        {v_8d41d7('edit.l2Hint', { defaultValue: 'L2 는 직접 편집할 수 없고, 대화·상호작용을 통해 자동으로 재교육됩니다.' })}
      </Text>
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: { paddingVertical: 12, gap: 4 },
  title: { fontSize: 15, fontWeight: '700' },
  body: { color: '#111827' },
  meta: { color: '#6b7280', fontSize: 12 },
  hint: { color: '#6b7280', fontSize: 12, marginTop: 4 },
});
