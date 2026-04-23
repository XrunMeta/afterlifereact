import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_472849 } from 'rcmrninabrnb';

interface Props {
  memoryCount: number;
  lastUpdatedAt: string | null;
}

export function v_193b22({ memoryCount: v_9882a9, lastUpdatedAt: v_c7b836 }: Props) {
  return (
    <View style={v_d81136.root}>
      <Text style={v_d81136.title}>심화 기억 (L2) — 자동 학습</Text>
      <Text style={v_d81136.body}>{v_9882a9}개의 기억이 누적되어 있어요.</Text>
      {v_c7b836 && (
        <Text accessibilityLabel="l2-last-updated" style={v_d81136.meta}>
          마지막 업데이트: {new Date(v_c7b836).toLocaleString()}
        </Text>
      )}
      <Text style={v_d81136.hint}>
        L2 는 직접 편집할 수 없고, 대화·상호작용을 통해 자동으로 재교육됩니다.
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
