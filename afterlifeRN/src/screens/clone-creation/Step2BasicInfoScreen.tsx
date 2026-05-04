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
import MemlowBasicInfo from './content/MemlowBasicInfo';
import DefaultBasicInfo from './content/DefaultBasicInfo';
import { COLORS, SIZES } from '../../components/constants';

type Props = { navigation: NativeStackNavigationProp<CreateStackParamList, 'Step2'> };

export default function Step2BasicInfoScreen({ navigation }: Props) {
  const draft = useCloneStore(s => s.creationDraft);
  const setCreationDraft = useCloneStore(s => s.setCreationDraft);

  const Content = draft.cloneType === 'memlow' ? MemlowBasicInfo : DefaultBasicInfo;
  const canNext = Content.validate(draft);

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title="기본 정보"
        showBackButton
        onBackPress={() => navigation.goBack()}
        stepInfo={{ current: 2, total: 7 }}
      />
      <StepIndicator currentStep={2} totalSteps={7} />
      <SafeScrollView
        contentContainerStyle={styles.content}
        showBottomBackground={false}
        keyboardShouldPersistTaps="handled"
      >
        <Content draft={draft} onChange={setCreationDraft} />
      </SafeScrollView>
      <View style={styles.bottomBar}>
        <Button
          title="다음 단계로 이동"
          onPress={() => navigation.navigate('Step3')}
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
