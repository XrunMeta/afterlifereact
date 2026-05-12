import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_472849 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_390fcc } from 'xpfgrcdafpntkgxfmgxpxnedjkvmtc';
import type { v_2b51a5 } from '../../navigation/types';
import v_556baf from '../../components/ui/SafeView';
import v_570c34 from '../../components/ui/SafeScrollView';
import v_258c1c from '../../components/common/PageHeader';
import v_3183b2 from '../../components/common/StepIndicator';
import v_d52542 from '../../components/common/Step3EntryBanner';
import v_1a40c4 from '../../components/ui/Button';
import { v_194498 } from '../../stores/cloneStore';
import v_922cea from './content/MemlowImageUpload';
import v_a6e1ad from './content/DefaultImageUpload';
import { v_1bfbd0, v_9b1a04 } from '../../components/constants';

type Props = { navigation: v_390fcc<v_2b51a5, 'Step3'> };

export default function v_3d9025({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_f04727 = v_194498(v_fd5f43 => v_fd5f43.creationDraft);
  const v_5795de = v_194498(v_fd5f43 => v_fd5f43.setCreationDraft);
  const [v_555f2e, v_4eb0c7] = v_5ab095(true);

  const v_b94c69 = v_f04727.cloneType === 'memlow' ? v_922cea : v_a6e1ad;
  const v_04fddf = v_b94c69.validate(v_f04727);

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title={v_8d41d7("create.stepTitles.3")}
        showBackButton
        onBackPress={() => {

          v_c65f5d.getParent()?.navigate("HomeTab" as never);
        }}
      />
      <StepIndicator currentStep={1} totalSteps={4} />
      {v_555f2e && <Step3EntryBanner onDismiss={() => v_4eb0c7(false)} />}
      <SafeScrollView contentContainerStyle={v_d81136.content} showBottomBackground={false}>
        <Content draft={v_f04727} onChange={v_5795de} />
      </SafeScrollView>
      <View style={v_d81136.bottomBar}>
        <Button
          title={v_8d41d7("create.next")}
          onPress={() => v_c65f5d.navigate('Step4')}
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
