import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';
import SafeView from '../../components/ui/SafeView';
import SafeScrollView from '../../components/ui/SafeScrollView';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import { useCloneStore } from '../../stores/cloneStore';
import { showAlert } from '../../stores/dialogStore';
import MemlowVoiceUpload from './content/MemlowVoiceUpload';
import DefaultVoiceUpload from './content/DefaultVoiceUpload';
import { COLORS, SIZES } from '../../components/constants';

type Props = { navigation: NativeStackNavigationProp<CreateStackParamList, 'Step4'> };

export default function Step4VoiceUploadScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const draft = useCloneStore(s => s.creationDraft);
  const setCreationDraft = useCloneStore(s => s.setCreationDraft);

  const isMemlow = draft.cloneType === 'memlow';
  const Content = isMemlow ? MemlowVoiceUpload : DefaultVoiceUpload;
  const canNext = Content.validate(draft);

  const handleBlockedNext = () => {
    const title = t('create.voice.nextBlockedTitle', { defaultValue: '음성 등록 필요' });
    if (isMemlow) {
      showAlert(title, t('create.voice.nextBlockedGeneric', { defaultValue: '먼저 음성을 등록해 주십시오.' }));
      return;
    }
    let msg: string;
    switch (draft.voiceMode ?? 'upload') {
      case 'record':

        msg = draft.voiceFile
          ? t('create.voice.nextBlockedRecordUploading', {
              defaultValue:
                '녹음 파일 등록이 끝나야 다음으로 넘어갈 수 있습니다. 등록에 실패했다면 다시 녹음해 주십시오.',
            })
          : t('create.voice.nextBlockedRecord', { defaultValue: '먼저 녹음을 완료해 주십시오.' });
        break;
      case 'preset':
        msg = t('create.voice.nextBlockedPreset', { defaultValue: '먼저 목소리를 선택해 주십시오.' });
        break;
      default:

        msg = draft.voiceFile
          ? t('create.voice.nextBlockedUploadRegistering', {
              defaultValue:
                '음성 파일 등록이 끝나야 다음으로 넘어갈 수 있습니다. 실패했다면 다시 시도해 주십시오.',
            })
          : t('create.voice.nextBlockedUpload', { defaultValue: '먼저 음성 파일을 업로드해 주십시오.' });
    }
    showAlert(title, msg);
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title={t("create.stepTitles.4")}
        showBackButton
        onBackPress={() => {

          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('Step3');
        }}
      />
      <SafeScrollView contentContainerStyle={styles.content} showBottomBackground={false}>
        <Content draft={draft} onChange={setCreationDraft} />
      </SafeScrollView>
      <View style={styles.bottomBar}>
        <Button
          title={t("create.next")}

          onPress={() => navigation.navigate('PersonaAssistant')}
          disabled={!canNext}
          onDisabledPress={handleBlockedNext}
        />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({

  content: {
    paddingHorizontal: SIZES.large,
    paddingTop: 16,
    paddingBottom: SIZES.large,
  },
  bottomBar: { padding: SIZES.large, borderTopWidth: 1, borderTopColor: COLORS.zinc100 },
});
