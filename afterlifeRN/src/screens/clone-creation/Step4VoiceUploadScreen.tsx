import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';
import SafeView from '../../components/ui/SafeView';
import SafeScrollView from '../../components/ui/SafeScrollView';
import PageHeader from '../../components/common/PageHeader';
import StepIndicator from '../../components/common/StepIndicator';
import Button from '../../components/ui/Button';
import { useCloneStore } from '../../stores/cloneStore';
import MemlowVoiceUpload from './content/MemlowVoiceUpload';
import DefaultVoiceUpload from './content/DefaultVoiceUpload';
import { COLORS, SIZES } from '../../components/constants';

type Props = { navigation: NativeStackNavigationProp<CreateStackParamList, 'Step4'> };

export default function Step4VoiceUploadScreen({ navigation }: Props) {
  const draft = useCloneStore(s => s.creationDraft);
  const setCreationDraft = useCloneStore(s => s.setCreationDraft);

  const Content = draft.cloneType === 'memlow' ? MemlowVoiceUpload : DefaultVoiceUpload;
  const canNext = Content.validate(draft);

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="음성 설정"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <StepIndicator currentStep={4} totalSteps={7} />
      <SafeScrollView contentContainerStyle={styles.content} showBottomBackground={false}>
        <Content draft={draft} onChange={setCreationDraft} />
      </SafeScrollView>
      <View style={styles.bottomBar}>
        <Button
          title="다음 단계로 이동"
          onPress={() => navigation.navigate('Step5')}
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
