import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';

import SafeView from '../../components/ui/SafeView';
import SafeScrollView from '../../components/ui/SafeScrollView';
import PageHeader from '../../components/common/PageHeader';
import StepIndicator from '../../components/common/StepIndicator';
import Button from '../../components/ui/Button';
import { useCloneStore } from '../../stores/cloneStore';
import { CLONE_TYPES } from '../../mocks/cloneTypeCatalog';
import type { CloneType } from '../../types/clone';
import { COLORS, SIZES, RADIUS } from '../../components/constants';

type Props = { navigation: NativeStackNavigationProp<CreateStackParamList, 'Step1'> };

export default function Step1CloneTypeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const setCreationDraft = useCloneStore(s => s.setCreationDraft);
  const current = useCloneStore(s => s.creationDraft.cloneType);
  const [selected, setSelected] = useState<CloneType | undefined>(current);

  const handleNext = () => {
    if (!selected) return;
    setCreationDraft({ cloneType: selected });
    navigation.navigate('Step2');
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      <PageHeader
        title={t("create.stepTitles.1")}
        showBackButton
        onBackPress={() => navigation.getParent()?.navigate('HomeTab' as never)}
      />
      <StepIndicator currentStep={1} totalSteps={7} />
      <SafeScrollView contentContainerStyle={styles.content} showBottomBackground={false}>
        <Text style={styles.title}>{t("create.stepTitles.1")}</Text>
        <Text style={styles.subtitle}>{t("create.type.defaultDesc")}</Text>
        <View style={styles.grid}>
          {CLONE_TYPES.map(t => {
            const active = selected === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                accessibilityRole="button"
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setSelected(t.id)}
              >
                <Feather name={t.iconName as any} size={24}
                  color={active ? COLORS.violet500 : COLORS.zinc600} />
                <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
                <Text style={styles.desc}>{t.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeScrollView>
      <View style={styles.bottomBar}>
        <Button title={t("create.next")} onPress={handleNext} disabled={!selected} />
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  content: { padding: SIZES.large },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4, color: COLORS.zinc900 },
  subtitle: { fontSize: 13, color: COLORS.zinc500, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%', padding: 16, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.zinc200, backgroundColor: COLORS.white,
  },
  cardActive: { borderColor: COLORS.violet500, backgroundColor: COLORS.violet100 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 8, color: COLORS.zinc800 },
  labelActive: { color: COLORS.violet600 },
  desc: { fontSize: 12, color: COLORS.zinc500, marginTop: 4 },
  bottomBar: { padding: SIZES.large, borderTopWidth: 1, borderTopColor: COLORS.zinc100 },
});
