import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';
import SafeView from '../../components/ui/SafeView';
import SafeScrollView from '../../components/ui/SafeScrollView';
import PageHeader from '../../components/common/PageHeader';
import StepIndicator from '../../components/common/StepIndicator';
import Step3EntryBanner from '../../components/common/Step3EntryBanner';
import Button from '../../components/ui/Button';
import { useCloneStore } from '../../stores/cloneStore';
import MemlowImageUpload from './content/MemlowImageUpload';
import DefaultImageUpload from './content/DefaultImageUpload';
import { COLORS, SIZES } from '../../components/constants';

type Props = { navigation: NativeStackNavigationProp<CreateStackParamList, 'Step3'> };

export default function Step3ImageUploadScreen({ navigation }: Props) {
  const draft = useCloneStore(s => s.creationDraft);
  const setCreationDraft = useCloneStore(s => s.setCreationDraft);
  const [bannerOpen, setBannerOpen] = useState(true);

  const Content = draft.cloneType === 'memlow' ? MemlowImageUpload : DefaultImageUpload;
  const canNext = Content.validate(draft);

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="이미지 업로드"
        showBackButton
        onBackPress={() => navigation.goBack()}
        stepInfo={{ current: 3, total: 7 }}
      />
      <StepIndicator currentStep={3} totalSteps={7} />
      {bannerOpen && <Step3EntryBanner onDismiss={() => setBannerOpen(false)} />}
      <SafeScrollView contentContainerStyle={styles.content} showBottomBackground={false}>
        <Content draft={draft} onChange={setCreationDraft} />
      </SafeScrollView>
      <View style={styles.bottomBar}>
        <Button
          title="다음 단계로 이동"
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
