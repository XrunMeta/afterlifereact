import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';
import SafeView from '../../components/ui/SafeView';
import SafeScrollView from '../../components/ui/SafeScrollView';
import PageHeader from '../../components/common/PageHeader';
import Step3EntryBanner from '../../components/common/Step3EntryBanner';
import Button from '../../components/ui/Button';
import { useCloneStore } from '../../stores/cloneStore';
import MemlowImageUpload from './content/MemlowImageUpload';
import DefaultImageUpload from './content/DefaultImageUpload';
import { COLORS, SIZES } from '../../components/constants';

type Props = { navigation: NativeStackNavigationProp<CreateStackParamList, 'Step3'> };

export default function Step3ImageUploadScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const draft = useCloneStore(s => s.creationDraft);
  const setCreationDraft = useCloneStore(s => s.setCreationDraft);
  const [bannerOpen, setBannerOpen] = useState(true);

  const Content = draft.cloneType === 'memlow' ? MemlowImageUpload : DefaultImageUpload;
  const canNext = Content.validate(draft);

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title={t("create.stepTitles.3")}
        showBackButton
        onBackPress={() => {

          navigation.getParent()?.navigate("HomeTab" as never);
        }}
      />
      {bannerOpen && <Step3EntryBanner onDismiss={() => setBannerOpen(false)} />}
      <SafeScrollView contentContainerStyle={styles.content} showBottomBackground={false}>
        <Content draft={draft} onChange={setCreationDraft} />
      </SafeScrollView>
      <View style={styles.bottomBar}>
        <Button
          title={t("create.next")}
          onPress={() => navigation.navigate('Step4')}
          disabled={!canNext}
        />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SIZES.large },
  bottomBar: { padding: SIZES.large, borderTopWidth: 1, borderTopColor: COLORS.zinc100 },
});
