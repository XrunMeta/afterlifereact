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
import MemlowVoiceUpload from './content/MemlowVoiceUpload';
import DefaultVoiceUpload from './content/DefaultVoiceUpload';
import { COLORS, SIZES } from '../../components/constants';

type Props = { navigation: NativeStackNavigationProp<CreateStackParamList, 'Step4'> };

export default function Step4VoiceUploadScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const draft = useCloneStore(s => s.creationDraft);
  const setCreationDraft = useCloneStore(s => s.setCreationDraft);

  const Content = draft.cloneType === 'memlow' ? MemlowVoiceUpload : DefaultVoiceUpload;
  const canNext = Content.validate(draft);

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title={t("create.stepTitles.4")}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <SafeScrollView contentContainerStyle={styles.content} showBottomBackground={false}>
        <Content draft={draft} onChange={setCreationDraft} />
      </SafeScrollView>
      <View style={styles.bottomBar}>
        <Button
          title={t("create.next")}

          onPress={() => navigation.navigate('Step6')}
          disabled={!canNext}
        />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({

  content: {
    paddingHorizontal: SIZES.large,
    paddingTop: 48,
    paddingBottom: SIZES.large,
  },
  bottomBar: { padding: SIZES.large, borderTopWidth: 1, borderTopColor: COLORS.zinc100 },
});
