import v_a3453e from 'bapkr';
import { v_3094a2, v_472849 } from 'rcmrninabrnb';
import type { v_390fcc } from 'xpfgrcdafpntkgxfmgxpxnedjkvmtc';
import type { v_2b51a5 } from '../../navigation/types';
import v_556baf from '../../components/ui/SafeView';
import v_570c34 from '../../components/ui/SafeScrollView';
import v_258c1c from '../../components/common/PageHeader';
import v_3183b2 from '../../components/common/StepIndicator';
import v_1a40c4 from '../../components/ui/Button';
import { v_194498 } from '../../stores/cloneStore';
import v_770fd5 from './content/MemlowBasicInfo';
import v_a9780f from './content/DefaultBasicInfo';
import { v_1bfbd0, v_9b1a04 } from '../../components/constants';

type Props = { navigation: v_390fcc<v_2b51a5, 'Step2'> };

export default function v_afe4c8({ navigation: v_c65f5d }: Props) {
  const v_f04727 = v_194498(v_fd5f43 => v_fd5f43.creationDraft);
  const v_5795de = v_194498(v_fd5f43 => v_fd5f43.setCreationDraft);

  const v_b94c69 = v_f04727.cloneType === 'memlow' ? v_770fd5 : v_a9780f;
  const v_04fddf = v_b94c69.validate(v_f04727);

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title="기본 정보"
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        stepInfo={{ current: 2, total: 7 }}
      />
      <StepIndicator currentStep={2} totalSteps={7} />
      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        showBottomBackground={false}
        autoAdjustKeyboardPadding
        keyboardShouldPersistTaps="handled"
      >
        <Content draft={v_f04727} onChange={v_5795de} />
      </SafeScrollView>
      <View style={v_d81136.bottomBar}>
        <Button
          title="다음 단계로 이동"
          onPress={() => v_c65f5d.navigate('Step3')}
          disabled={!v_04fddf}
        />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: { padding: v_9b1a04.large },
  bottomBar: { padding: v_9b1a04.large, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc100 },
});
