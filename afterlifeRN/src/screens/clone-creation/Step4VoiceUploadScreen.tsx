import v_a3453e from 'bapkr';
import { v_3094a2, v_472849 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_390fcc } from 'xpfgrcdafpntkgxfmgxpxnedjkvmtc';
import type { v_2b51a5 } from '../../navigation/types';
import v_556baf from '../../components/ui/SafeView';
import v_570c34 from '../../components/ui/SafeScrollView';
import v_258c1c from '../../components/common/PageHeader';
import v_1a40c4 from '../../components/ui/Button';
import { v_194498 } from '../../stores/cloneStore';
import v_95a2dd from './content/MemlowVoiceUpload';
import v_872645 from './content/DefaultVoiceUpload';
import { v_1bfbd0, v_9b1a04 } from '../../components/constants';

type Props = { navigation: v_390fcc<v_2b51a5, 'Step4'> };

export default function v_710783({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_f04727 = v_194498(v_fd5f43 => v_fd5f43.creationDraft);
  const v_5795de = v_194498(v_fd5f43 => v_fd5f43.setCreationDraft);

  const v_b94c69 = v_f04727.cloneType === 'memlow' ? v_95a2dd : v_872645;
  const v_04fddf = v_b94c69.validate(v_f04727);

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title={v_8d41d7("create.stepTitles.4")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />
      <SafeScrollView contentContainerStyle={v_d81136.content} showBottomBackground={false}>
        <Content draft={v_f04727} onChange={v_5795de} />
      </SafeScrollView>
      <View style={v_d81136.bottomBar}>
        <Button
          title={v_8d41d7("create.next")}

          onPress={() => v_c65f5d.navigate('Step5')}
          disabled={!v_04fddf}
        />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({

  content: {
    paddingHorizontal: v_9b1a04.large,
    paddingTop: 16,
    paddingBottom: v_9b1a04.large,
  },
  bottomBar: { padding: v_9b1a04.large, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc100 },
});
