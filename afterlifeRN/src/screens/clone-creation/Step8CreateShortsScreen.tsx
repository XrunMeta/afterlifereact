import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_39a996,
} from 'rcmrninabrnb';
import { v_650cfa } from 'ixigazcpvfldbecwtbvavtbi';
import type { v_432191 } from 'xpfgrcdafpntkgxfmgxpxnedjkvmtc';
import type { v_2b51a5 } from '../../navigation/types';
import { v_9a8286 } from '../../api/client';
import { v_1ed7d9 } from '../../stores/authStore';
import type { v_813230 } from '../../types/domain';

type Props = v_432191<v_2b51a5, 'Step8'>;

export default function v_d19b01({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const v_6e0fd3 = v_c7daf6.params.cloneId;
  const v_013af2 = v_1ed7d9((v_fd5f43) => v_fd5f43.user?.id) ?? 1;
  const [v_d308b5, v_5193f8] = v_5ab095<v_813230>('queued');
  const [v_1458b7, v_21ebe6] = v_5ab095<string | null>(null);
  const [v_53aa09, v_85e3d9] = v_5ab095<number | null>(null);
  const [v_78e23a, v_014bd3] = v_5ab095(false);
  const v_1e1f71 = v_e662ae<ReturnType<typeof setInterval> | null>(null);

  const v_965edf = () => {
    v_5193f8('queued');
    v_21ebe6(null);
    v_014bd3(false);
    v_9a8286
      .generateShort(v_6e0fd3, v_013af2)
      .then(({ shortId: v_389afb }) => v_85e3d9(v_389afb))
      .catch((v_9e86fd) => {
        if (String(v_9e86fd?.message ?? '').includes('Forbidden')) {
          v_014bd3(true);
        } else {
          v_5193f8('failed');
        }
      });
  };

  v_c4deb2(() => {
    v_965edf();

  }, [v_6e0fd3, v_013af2]);

  v_c4deb2(() => {
    if (v_53aa09 == null) return;
    const v_9a5f22 = async () => {
      try {
        const v_fd5f43 = await v_9a8286.getShort(v_53aa09);
        v_5193f8(v_fd5f43.status);
        v_21ebe6(v_fd5f43.mediaUrl);
        if ((v_fd5f43.status === 'ready' || v_fd5f43.status === 'failed') && v_1e1f71.current) {
          clearInterval(v_1e1f71.current);
          v_1e1f71.current = null;
        }
      } catch {
        v_5193f8('failed');
      }
    };
    v_1e1f71.current = setInterval(v_9a5f22, 250);
    v_9a5f22();
    return () => {
      if (v_1e1f71.current) {
        clearInterval(v_1e1f71.current);
        v_1e1f71.current = null;
      }
    };
  }, [v_53aa09]);

  const v_91ec30 = () => {
    v_c65f5d
      .getParent()
      ?.dispatch(v_650cfa.navigate({ name: 'HomeTab' }));
  };

  if (v_78e23a) {
    return (
      <View style={v_d81136.root}>
        <Text style={v_d81136.title}>소개 영상</Text>
        <View accessibilityLabel="step8-forbidden" style={v_d81136.center}>
          <Text style={v_d81136.muted}>이 클론의 소유자만 영상을 만들 수 있어요.</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="step8-skip"
          onPress={v_91ec30}
          style={v_d81136.btn}
        >
          <Text>홈으로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={v_d81136.root}>
      <Text style={v_d81136.title}>소개 영상</Text>
      {v_d308b5 === 'ready' ? (
        <View accessibilityLabel="step8-preview" style={v_d81136.center}>
          <Text style={v_d81136.muted}>{v_1458b7 ?? '(preview)'}</Text>
        </View>
      ) : (
        <View accessibilityLabel="step8-progress" style={v_d81136.center}>
          <ActivityIndicator />
          <Text style={v_d81136.muted}>생성 중… ({v_d308b5})</Text>
        </View>
      )}
      <View style={v_d81136.row}>
        <TouchableOpacity
          accessibilityLabel="step8-skip"
          onPress={v_91ec30}
          style={v_d81136.btn}
        >
          <Text>건너뛰기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="step8-retry"
          onPress={v_965edf}
          style={v_d81136.btn}
        >
          <Text>다시 생성</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="step8-done"
          disabled={v_d308b5 !== 'ready'}
          onPress={v_91ec30}
          style={[v_d81136.btn, v_d308b5 !== 'ready' && v_d81136.btnDisabled]}
        >
          <Text>완료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#6b7280' },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  btn: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
});
