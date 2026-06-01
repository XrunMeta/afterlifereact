

import v_a3453e, { v_c4deb2, v_5ab095 } from 'bapkr';
import {
  v_3094a2,
  v_19b633,
  v_122070,
  v_39a996,
  v_4623af,
  v_472849,
} from 'rcmrninabrnb';
import { v_ada615 } from 'ixigazcpvfldbecwtbvavtbi';
import { v_194498 } from '../../stores/cloneStore';
import { v_1ed7d9 } from '../../stores/authStore';
import { v_61a853, v_4bf019 } from '../../api/clones';
import type { v_c8af29 } from '../../types/clone';
import v_734250 from './content/DynamicQuestion';
import { v_1bfbd0 } from '../../components/constants';

function v_a7e583(q: v_c8af29, v_00da68): boolean {
  if (!v_ab6401.showWhen) return true;
  return Object.entries(v_ab6401.showWhen).every(
    ([v_3c1d34, v_441249]) => (v_00da68[v_3c1d34] ?? '').includes(v_441249),
  );
}

export default function v_8e5b58() {
  const v_c65f5d = v_ada615<any>();
  const v_f04727 = v_194498((v_fd5f43) => v_fd5f43.creationDraft);
  const v_a07441 = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_c3519b, v_54a43f] = v_5ab095<v_c8af29[]>([]);
  const [v_6f7c85, v_0a8beb] = v_5ab095<Record<string, string[]>>({});
  const [v_00da68, v_44427b] = v_5ab095<Record<string, string>>(
    v_f04727.personaAnswers ?? {},
  );
  const [v_683210, v_34a50a] = v_5ab095(true);

  v_c4deb2(() => {
    let v_759436 = true;
    (async () => {
      try {
        const v_727031 = {
          name: v_f04727.name,
          description: v_f04727.description,
          relation: v_f04727.relation,
          age: v_f04727.personaAge,
          gender: v_f04727.personaGender,
          personaTypes: v_f04727.personaTypes,
          notes: v_f04727.personaNotes,
        };

        const v_212049 = await v_61a853(v_2ca7e0!).catch(() => [] as v_c8af29[]);
        const v_af1e64 = await v_4bf019(v_2ca7e0!, v_727031).catch(() => ({}));
        if (!v_759436) return;
        v_54a43f(v_212049);
        v_0a8beb(v_af1e64);
      } finally {
        if (v_759436) v_34a50a(false);
      }
    })();
    return () => {
      v_759436 = false;
    };

  }, []);

  const v_5e2995 = (v_b24339, v_3b402b) =>
    v_44427b((v_ba2215) => {
      const v_a448ad = { ...v_ba2215, [v_b24339]: v_3b402b };

      for (const v_ab6401 of v_c3519b) {
        if (v_ab6401.showWhen && !v_a7e583(v_ab6401, v_a448ad) && v_a448ad[v_ab6401.key] !== undefined) {
          delete v_a448ad[v_ab6401.key];
        }
      }
      return v_a448ad;
    });

  const v_de6401 = () => {

    v_a07441({ personaAnswers: v_00da68 });
    v_c65f5d.navigate('Step3');
  };

  if (v_683210) {
    return (
      <View style={v_d81136.center}>
        <ActivityIndicator color={v_1bfbd0.violet600} />
        <Text style={v_d81136.hint}>페르소나 후보를 준비하고 있어요...</Text>
      </View>
    );
  }

  const v_984cf3 = v_c3519b.filter((v_ab6401) => v_a7e583(v_ab6401, v_00da68));

  return (
    <ScrollView contentContainerStyle={v_d81136.wrap}>
      <Text style={v_d81136.title}>페르소나 생성 도우미</Text>
      <Text style={v_d81136.hint}>
        후보를 탭하면 답으로 반영돼요. 직접 입력하거나 비워둬도 됩니다.
      </Text>
      {v_c3519b.length === 0 && (
        <Text style={v_d81136.hint}>
          지금은 도우미를 사용할 수 없어요. 다음으로 진행하세요.
        </Text>
      )}
      {v_984cf3.map((v_ab6401) => (
        <DynamicQuestion
          key={v_ab6401.key}
          question={v_ab6401}
          candidates={v_6f7c85[v_ab6401.key]}
          value={v_00da68[v_ab6401.key]}
          onAnswer={v_5e2995}
        />
      ))}
      <TouchableOpacity style={v_d81136.nextBtn} onPress={v_de6401} accessibilityRole="button">
        <Text style={v_d81136.nextText}>다음</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const v_d81136 = v_472849.create({
  wrap: { padding: 20, gap: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: v_1bfbd0.zinc900, marginBottom: 4 },
  hint: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 12 },
  nextBtn: {
    backgroundColor: v_1bfbd0.violet600,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  nextText: { color: v_1bfbd0.white, fontSize: 16, fontWeight: '600' },
});
