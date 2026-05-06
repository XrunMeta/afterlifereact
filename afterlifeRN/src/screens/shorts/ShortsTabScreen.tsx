import v_a3453e, { v_c4deb2, v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_9cabcb, v_4623af, v_472849 } from 'rcmrninabrnb';
import { v_ada615 } from 'ixigazcpvfldbecwtbvavtbi';
import { v_772971 } from 'jmpfvteuuztnp';
import { v_9a8286 } from '../../api/client';
import { v_1ed7d9 } from '../../stores/authStore';
import type { v_ec2546 } from '../../api/types';

export default function v_87eb38() {
  const { t: v_8d41d7 } = v_772971();
  const v_3c9f12 = v_ada615<any>();
  const v_013af2 = v_1ed7d9((v_fd5f43) => v_fd5f43.user?.id) ?? 1;
  const [v_4622b9, v_fa923c] = v_5ab095<v_ec2546[] | null>(null);

  v_c4deb2(() => {
    v_9a8286.listShorts(v_013af2).then((v_cb35cb) => v_fa923c(v_cb35cb.items));
  }, [v_013af2]);

  if (v_4622b9 == null) {
    return <View style={v_d81136.empty} />;
  }

  if (v_4622b9.length === 0) {
    return (
      <View style={v_d81136.empty}>
        <Text style={v_d81136.emptyTitle}>{v_8d41d7("feed.shortsEmptyTitle")}</Text>
        <Text style={v_d81136.emptyBody}>{v_8d41d7("feed.shortsHint")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={v_4622b9}
      keyExtractor={(v_fd5f43) => String(v_fd5f43.shortId)}
      renderItem={({ item: v_8c0b26, index: v_a56041 }) => (
        <View style={v_d81136.card}>
          <TouchableOpacity
            accessibilityLabel={`short-item-${v_a56041}`}
            onPress={() => v_3c9f12.navigate('Chat', { cloneId: v_8c0b26.cloneId })}
          >
            <Text style={v_d81136.title}>{v_8c0b26.name}</Text>
            <Text style={v_d81136.meta}>{v_8c0b26.cloneType}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`short-detail-${v_a56041}`}
            onPress={() => v_3c9f12.navigate('ClonesTab', { screen: 'CloneDetail', params: { cloneId: v_8c0b26.cloneId } })}
            style={v_d81136.detailBtn}
          >
            <Text style={v_d81136.detailText}>{v_8d41d7("feed.shortsViewMore")}</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const v_d81136 = v_472849.create({
  empty: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyBody: { color: '#6b7280', textAlign: 'center' },
  card: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4, fontSize: 12 },
  detailBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#111',
  },
  detailText: { color: '#fff', fontSize: 12 },
});
