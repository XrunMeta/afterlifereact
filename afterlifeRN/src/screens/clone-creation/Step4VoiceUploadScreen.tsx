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
import { v_889fad } from '../../stores/dialogStore';
import v_95a2dd from './content/MemlowVoiceUpload';
import v_872645, { v_2ba26d } from './content/DefaultVoiceUpload';
import { v_1bfbd0, v_9b1a04 } from '../../components/constants';

type Props = { navigation: v_390fcc<v_2b51a5, 'Step4'> };

export default function v_710783({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_f04727 = v_194498(v_fd5f43 => v_fd5f43.creationDraft);
  const v_5795de = v_194498(v_fd5f43 => v_fd5f43.setCreationDraft);

  const v_e93e18 = v_f04727.cloneType === 'memlow';
  const v_b94c69 = v_e93e18 ? v_95a2dd : v_872645;
  const v_04fddf = v_b94c69.validate(v_f04727);

  const v_c3dcaf = () => {
    const v_9f1622 = v_8d41d7('create.voice.nextBlockedTitle', { defaultValue: '음성 등록 필요' });
    if (v_e93e18) {
      v_889fad(v_9f1622, v_8d41d7('create.voice.nextBlockedGeneric', { defaultValue: '먼저 음성을 등록해 주십시오.' }));
      return;
    }
    let v_badeaf;
    switch (v_2ba26d(v_f04727)) {
      case 'record':

        v_badeaf = v_f04727.voiceFile
          ? v_8d41d7('create.voice.nextBlockedRecordUploading', {
              defaultValue:
                '녹음 파일 등록이 끝나야 다음으로 넘어갈 수 있습니다. 등록에 실패했다면 다시 녹음해 주십시오.',
            })
          : v_8d41d7('create.voice.nextBlockedRecord', { defaultValue: '먼저 녹음을 완료해 주십시오.' });
        break;
      case 'preset':
        v_badeaf = v_8d41d7('create.voice.nextBlockedPreset', { defaultValue: '먼저 목소리를 선택해 주십시오.' });
        break;
      default:

        v_badeaf = v_f04727.voiceFile
          ? v_8d41d7('create.voice.nextBlockedUploadRegistering', {
              defaultValue:
                '음성 파일 등록이 끝나야 다음으로 넘어갈 수 있습니다. 실패했다면 다시 시도해 주십시오.',
            })
          : v_8d41d7('create.voice.nextBlockedUpload', { defaultValue: '먼저 음성 파일을 업로드해 주십시오.' });
    }
    v_889fad(v_9f1622, v_badeaf);
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title={v_8d41d7("create.stepTitles.4")}
        showBackButton
        onBackPress={() => {

          if (v_c65f5d.canGoBack()) v_c65f5d.goBack();
          else v_c65f5d.navigate('Step3');
        }}
      />
      <SafeScrollView contentContainerStyle={v_d81136.content} showBottomBackground={false}>
        <Content draft={v_f04727} onChange={v_5795de} />
      </SafeScrollView>
      <View style={v_d81136.bottomBar}>
        <Button
          title={v_8d41d7("create.next")}

          onPress={() => v_c65f5d.navigate('PersonaAssistant')}
          disabled={!v_04fddf}
          onDisabledPress={v_c3dcaf}
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
