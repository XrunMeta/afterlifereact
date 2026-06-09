import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';
import SafeView from '../../components/ui/SafeView';
import SafeScrollView from '../../components/ui/SafeScrollView';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import { useCloneStore } from '../../stores/cloneStore';
import MemlowImageUpload from './content/MemlowImageUpload';
import DefaultImageUpload from './content/DefaultImageUpload';
import PersonaCreationPaymentGate from './components/PersonaCreationPaymentGate';
import { COLORS, SIZES } from '../../components/constants';
import { uploadFile } from '../../api/files';
import { createAssetJob } from '../../api/clones';
import { useAuthStore } from '../../stores/authStore';

type Props = { navigation: NativeStackNavigationProp<CreateStackParamList, 'Step3'> };

export default function Step3ImageUploadScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const draft = useCloneStore(s => s.creationDraft);
  const setCreationDraft = useCloneStore(s => s.setCreationDraft);
  const accessToken = useAuthStore(s => s.accessToken);
  const [submitting, setSubmitting] = useState(false);

  const [gatePassed, setGatePassed] = useState(!!draft.pin);

  const Content = draft.cloneType === 'memlow' ? MemlowImageUpload : DefaultImageUpload;
  const canNext = Content.validate(draft);

  const handleNext = async () => {
    if (submitting) return;

    if (draft.avatarFileId) {
      navigation.navigate('Step4');
      return;
    }
    if (!draft.imageFile || !accessToken) {
      navigation.navigate('Step4');
      return;
    }
    setSubmitting(true);
    try {
      const ext = draft.imageFile.split('.').pop()?.toLowerCase() ?? '';
      const mime =
        ext === 'png' ? 'image/png'
        : ext === 'webp' ? 'image/webp'
        : 'image/jpeg';
      const uploaded = await uploadFile(accessToken, draft.imageFile, {
        purpose: 'clone_avatar',
        mimeType: mime,
        fileName: `avatar.${ext || 'jpg'}`,
      });

      let jobId: string | undefined;
      try {
        const jobRes = await createAssetJob(accessToken, {
          kind: 'idle_video',
          src_file_id: uploaded.id,
        });
        jobId = jobRes.job_id;
        console.log('[Step3] idle_video job created:', jobId);
      } catch (jobErr) {
        console.warn('[Step3] idle_video job failed (ignored):', jobErr);
      }
      setCreationDraft({
        avatarFileId: uploaded.id,
        avatarUrl: uploaded.url,
        ...(jobId ? { idleVideoJobId: jobId } : {}),
      });
    } catch (uploadErr) {
      console.warn('[Step3] avatar upload failed (ignored):', uploadErr);
    } finally {
      setSubmitting(false);
      navigation.navigate('Step4');
    }
  };

  if (!gatePassed) {
    return (
      <PersonaCreationPaymentGate
        onProceed={() => setGatePassed(true)}
        onCancel={() => navigation.getParent()?.navigate("HomeTab" as never)}
      />
    );
  }

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title={t("create.stepTitles.3")}
        showBackButton
        onBackPress={() => {

          navigation.getParent()?.navigate("HomeTab" as never);
        }}
      />
      <SafeScrollView contentContainerStyle={styles.content} showBottomBackground={false}>
        <Content draft={draft} onChange={setCreationDraft} />
      </SafeScrollView>
      <View style={styles.bottomBar}>
        <Button
          title={submitting ? '잠시만요...' : t("create.next")}
          onPress={handleNext}
          disabled={!canNext || submitting}
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
