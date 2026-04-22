import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import type { v_390fcc } from 'xpfgrcdafpntkgxfmgxpxnedjkvmtc';
import type { v_2b51a5 } from '../../navigation/types';

import v_556baf from '../../components/ui/SafeView';
import v_570c34 from '../../components/ui/SafeScrollView';
import v_258c1c from '../../components/common/PageHeader';
import v_3183b2 from '../../components/common/StepIndicator';
import v_1a40c4 from '../../components/ui/Button';
import { v_194498 } from '../../stores/cloneStore';
import { v_aad223 } from '../../mocks/cloneTypeCatalog';
import type { v_d79d7f } from '../../types/clone';
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from '../../components/constants';

type Props = { navigation: v_390fcc<v_2b51a5, 'Step1'> };

export default function v_84d7a5({ navigation: v_c65f5d }: Props) {
  const v_5795de = v_194498(v_fd5f43 => v_fd5f43.setCreationDraft);
  const v_275ccd = v_194498(v_fd5f43 => v_fd5f43.creationDraft.cloneType);
  const [v_587413, v_2122dd] = v_5ab095<v_d79d7f | undefined>(v_275ccd);

  const v_420661 = () => {
    if (!v_587413) return;
    v_5795de({ cloneType: v_587413 });
    v_c65f5d.navigate('Step2');
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title="클론 타입"
        showBackButton
        onBackPress={() => v_c65f5d.getParent()?.navigate('HomeTab' as never)}
        stepInfo={{ current: 1, total: 7 }}
      />
      <StepIndicator currentStep={1} totalSteps={7} />
      <SafeScrollView contentContainerStyle={v_d81136.content} showBottomBackground={false}>
        <Text style={v_d81136.title}>어떤 클론을 만들까요?</Text>
        <Text style={v_d81136.subtitle}>나중에 변경할 수 없으니 신중히 선택해 주세요.</Text>
        <View style={v_d81136.grid}>
          {v_aad223.map(v_8d41d7 => {
            const v_f8b770 = v_587413 === v_8d41d7.id;
            return (
              <TouchableOpacity
                key={v_8d41d7.id}
                accessibilityRole="button"
                style={[v_d81136.card, v_f8b770 && v_d81136.cardActive]}
                onPress={() => v_2122dd(v_8d41d7.id)}
              >
                <Feather name={v_8d41d7.iconName as any} size={24}
                  color={v_f8b770 ? v_1bfbd0.violet500 : v_1bfbd0.zinc600} />
                <Text style={[v_d81136.label, v_f8b770 && v_d81136.labelActive]}>{v_8d41d7.label}</Text>
                <Text style={v_d81136.desc}>{v_8d41d7.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeScrollView>
      <View style={v_d81136.bottomBar}>
        <Button title="다음" onPress={v_420661} disabled={!v_587413} />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { padding: v_9b1a04.large },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4, color: v_1bfbd0.zinc900 },
  subtitle: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%', padding: 16, borderRadius: v_8b0c90.md,
    borderWidth: 1, borderColor: v_1bfbd0.zinc200, backgroundColor: v_1bfbd0.white,
  },
  cardActive: { borderColor: v_1bfbd0.violet500, backgroundColor: v_1bfbd0.violet100 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 8, color: v_1bfbd0.zinc800 },
  labelActive: { color: v_1bfbd0.violet600 },
  desc: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 4 },
  bottomBar: { padding: v_9b1a04.large, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc100 },
});
