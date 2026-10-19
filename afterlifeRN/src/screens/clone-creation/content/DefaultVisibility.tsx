import v_a3453e, { v_c4deb2, v_5ab095 } from 'bapkr';
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_aa7413,
  v_09d0e5,
  v_122070,
  v_cf9c33,
  v_39a996,
} from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90, v_a9d3e9, v_e3d001, v_9b1a04 } from '../../../components/constants';
import { v_1ed7d9 } from '../../../stores/authStore';
import { v_5959d8, type v_7428e9 } from '../../../api/users';
import { v_889fad } from '../../../stores/dialogStore';
import v_1a40c4 from '../../../components/ui/Button';

type V = 'public' | 'followers' | 'selected' | 'private';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_fca930, v_0b6eca] = v_5ab095(false);
  const [v_9f46ad, v_2f8055] = v_5ab095(false);
  const [v_ba3f04, v_cd488d] = v_5ab095<v_7428e9[]>([]);
  const [v_b8ced6, v_ffc8a4] = v_5ab095(false);
  const [v_a63968, v_c19f9e] = v_5ab095<Set<number>>(
    new Set(v_f04727.allowedViewerIds ?? []),
  );
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);
  const v_275ccd = (v_f04727.visibility as V) ?? 'public';
  const v_a75897 = v_f04727.allowedViewerIds?.length ?? 0;

  v_c4deb2(() => {
    if (!v_fca930) return;
    v_c19f9e(new Set(v_f04727.allowedViewerIds ?? []));
    if (!v_2ca7e0 || !v_f5f393) return;
    v_ffc8a4(true);
    v_5959d8(v_2ca7e0, v_f5f393)
      .then((v_8f00b9) => v_cd488d(v_8f00b9.items ?? []))
      .catch((v_49263d) => {
        console.warn('[DefaultVisibility] load following failed:', v_49263d);
        v_cd488d([]);
      })
      .finally(() => v_ffc8a4(false));

  }, [v_fca930]);

  const v_95825a = [
    {
      value: 'public',
      icon: 'globe',
      title: v_8d41d7('create.visibility.publicTitle'),
      desc: v_8d41d7('create.visibility.publicDesc'),
    },
    {
      value: 'followers',
      icon: 'users',
      title: v_8d41d7('create.visibility.followersTitle'),
      desc: v_8d41d7('create.visibility.followersDesc'),
    },
    {
      value: 'selected',
      icon: 'user-check',
      title: v_8d41d7('create.visibility.selectedTitle', { defaultValue: '특정 친구만' }),
      desc:
        v_275ccd === 'selected' && v_a75897 > 0
          ? v_8d41d7('create.visibility.selectedDescCount', {
              defaultValue: '친구 {{count}}명 선택됨 — 다시 눌러 변경',
              count: v_a75897,
            })
          : v_8d41d7('create.visibility.selectedDesc', {
              defaultValue: '탭하여 친구를 선택하세요',
            }),
    },
    {
      value: 'private',
      icon: 'lock',
      title: v_8d41d7('create.visibility.privateTitle'),
      desc: v_8d41d7('create.visibility.privateDesc'),
    },
  ];

  const v_6121dc = async (v_81e2ef) => {
    if (v_81e2ef === 'selected') {
      v_b187d9({ visibility: 'selected' });
      if (!v_2ca7e0 || !v_f5f393) {
        v_889fad(
          v_8d41d7('common.notice'),
          v_8d41d7('create.visibility.friendPickerNoAuth', {
            defaultValue: '로그인 후 다시 시도하세요.',
          }),
        );
        return;
      }

      v_2f8055(true);
      try {
        const v_8f00b9 = await v_5959d8(v_2ca7e0, v_f5f393);
        const v_4622b9 = v_8f00b9.items ?? [];
        if (v_4622b9.length === 0) {
          v_889fad(
            v_8d41d7('create.visibility.friendPickerEmptyTitle', {
              defaultValue: '친구가 없어요',
            }),
            v_8d41d7('create.visibility.friendPickerEmptyMessage', {
              defaultValue:
                '아직 팔로우 중인 사람이 없습니다. 다른 공개 범위를 선택하거나, 다른 사람을 팔로우한 후 다시 시도하세요.',
            }),
          );
          return;
        }

        v_cd488d(v_4622b9);
      } catch (v_49263d) {
        console.warn('[DefaultVisibility] pre-fetch following failed:', v_49263d);

      } finally {
        v_2f8055(false);
      }

      requestAnimationFrame(() => v_0b6eca(true));
      return;
    }
    v_b187d9({ visibility: v_81e2ef });
  };

  const v_3931f1 = (v_389afb) => {
    v_c19f9e((v_ba2215) => {
      const v_a448ad = new Set(v_ba2215);
      if (v_a448ad.has(v_389afb)) v_a448ad.delete(v_389afb);
      else v_a448ad.add(v_389afb);
      return v_a448ad;
    });
  };

  const v_65d937 = () => {
    v_b187d9({ allowedViewerIds: Array.from(v_a63968) });
    v_0b6eca(false);
  };

  return (
    <View style={v_d81136.wrap}>
      {v_95825a.map((v_68b2be) => {
        const v_f8b770 = v_275ccd === v_68b2be.value;
        const v_3f8465 = v_68b2be.value === 'selected' && v_9f46ad;
        return (
          <TouchableOpacity
            key={v_68b2be.value}
            style={[v_d81136.row, v_f8b770 && v_d81136.rowActive]}
            onPress={() => v_6121dc(v_68b2be.value)}
            disabled={v_3f8465}
          >
            <Feather
              name={v_68b2be.icon as any}
              size={18}
              color={v_f8b770 ? v_a9d3e9 : v_1bfbd0.zinc500}
            />
            <View style={{ flex: 1 }}>
              <Text style={v_d81136.title}>{v_68b2be.title}</Text>
              <Text style={v_d81136.desc}>{v_68b2be.desc}</Text>
            </View>
            <View style={[v_d81136.radio, v_f8b770 && v_d81136.radioActive]}>
              {v_f8b770 && <View style={v_d81136.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}

      {
}
      <Modal
        visible={v_fca930}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => v_0b6eca(false)}
      >
        <Pressable
          style={v_d81136.overlay}
          onPress={() => v_0b6eca(false)}
        >
          <Pressable style={v_d81136.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_d81136.modalTitle}>
              {v_8d41d7('friendPicker.title', { defaultValue: '특정 친구에게만 공개' })}
            </Text>
            <Text style={v_d81136.modalDesc}>
              {v_8d41d7('friendPicker.desc', {
                defaultValue: '내가 팔로우 중인 사람 중에 공개할 친구를 선택하세요.',
              })}
            </Text>
            {v_b8ced6 ? (
              <ActivityIndicator
                style={{ paddingVertical: 24 }}
                color={v_1bfbd0.zinc500}
              />
            ) : v_ba3f04.length === 0 ? (
              <View style={v_d81136.empty}>
                <Feather name="users" size={32} color={v_1bfbd0.zinc300} />
                <Text style={v_d81136.emptyText}>
                  {v_8d41d7('friendPicker.empty', {
                    defaultValue: '아직 팔로우 중인 사람이 없어요',
                  })}
                </Text>
              </View>
            ) : (
              <ScrollView style={v_d81136.list} keyboardShouldPersistTaps="handled">
                {v_ba3f04.map((v_ceb55a) => {
                  const v_da90dc = v_a63968.has(v_ceb55a.userId);
                  return (
                    <TouchableOpacity
                      key={v_ceb55a.userId}
                      style={v_d81136.friendRow}
                      onPress={() => v_3931f1(v_ceb55a.userId)}
                      activeOpacity={0.7}
                    >
                      {v_ceb55a.avatarUrl ? (
                        <Image
                          source={{ uri: v_ceb55a.avatarUrl }}
                          style={v_d81136.avatar}
                        />
                      ) : (
                        <View style={[v_d81136.avatar, v_d81136.avatarPh]}>
                          <Feather name="user" size={18} color={v_1bfbd0.zinc400} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={v_d81136.name} numberOfLines={1}>
                          {v_ceb55a.name ?? v_ceb55a.email}
                        </Text>
                        <Text style={v_d81136.email} numberOfLines={1}>
                          {v_ceb55a.email}
                        </Text>
                      </View>
                      <View style={[v_d81136.check, v_da90dc && v_d81136.checkOn]}>
                        {v_da90dc && (
                          <Feather name="check" size={14} color={v_1bfbd0.white} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <View style={v_d81136.actions}>
              <Button
                title={v_8d41d7('common.cancel', { defaultValue: '취소' })}
                variant="ghost"
                onPress={() => v_0b6eca(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={v_8d41d7('friendPicker.confirmWithCount', {
                  n: v_a63968.size,
                  defaultValue: '확인 ({{n}}명)',
                })}
                variant="primary"
                onPress={v_65d937}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

v_b0de9c.validate = (_d: v_c2a674): boolean => true;

const v_bba87e = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_bba87e;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  rowActive: v_e3d001.cardTint,
  title: { fontSize: 14, fontWeight: '600', color: v_1bfbd0.zinc800 },
  desc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: v_1bfbd0.zinc300,
  },
  radioActive: v_e3d001.radioActive,
  radioDot: { flex: 1, margin: 3, borderRadius: 4, ...v_e3d001.radioDot },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    padding: v_9b1a04.large,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: v_1bfbd0.zinc900,
    marginBottom: 4,
  },
  modalDesc: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 12 },
  list: { maxHeight: 360 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 13, color: v_1bfbd0.zinc500 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: v_1bfbd0.zinc100 },
  avatarPh: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, color: v_1bfbd0.zinc800, fontWeight: '500' },
  email: { fontSize: 12, color: v_1bfbd0.zinc500 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: v_1bfbd0.zinc300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: v_e3d001.checkOn,
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
