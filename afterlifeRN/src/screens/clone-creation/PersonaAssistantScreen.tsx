

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCloneStore } from '../../stores/cloneStore';
import { useAuthStore } from '../../stores/authStore';
import { getPersonaQuestions, personaSuggest } from '../../api/clones';
import type { PersonaQuestion } from '../../types/clone';
import DynamicQuestion from './content/DynamicQuestion';
import { COLORS } from '../../components/constants';

function isVisible(q: PersonaQuestion, answers: Record<string, string>): boolean {
  if (!q.showWhen) return true;
  return Object.entries(q.showWhen).every(
    ([refKey, refVal]) => (answers[refKey] ?? '').includes(refVal),
  );
}

export default function PersonaAssistantScreen() {
  const navigation = useNavigation<any>();
  const draft = useCloneStore((s: any) => s.creationDraft);
  const setDraft = useCloneStore((s: any) => s.setCreationDraft);
  const accessToken = useAuthStore((s: any) => s.accessToken);

  const [questions, setQuestions] = useState<PersonaQuestion[]>([]);
  const [candidates, setCandidates] = useState<Record<string, string[]>>({});
  const [answers, setAnswers] = useState<Record<string, string>>(
    draft.personaAnswers ?? {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const profile = {
          name: draft.name,
          description: draft.description,
          relation: draft.relation,
          age: draft.personaAge,
          gender: draft.personaGender,
          personaTypes: draft.personaTypes,
          notes: draft.personaNotes,
        };
        const [qs, sg] = await Promise.all([
          getPersonaQuestions(accessToken!),
          personaSuggest(accessToken!, profile).catch(() => ({})),
        ]);
        if (!alive) return;
        setQuestions(qs);
        setCandidates(sg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };

  }, []);

  const onAnswer = (key: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const onNext = () => {

    setDraft({ personaAnswers: answers });
    navigation.navigate('Step3');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.violet600} />
        <Text style={styles.hint}>페르소나 후보를 준비하고 있어요...</Text>
      </View>
    );
  }

  const visibleQuestions = questions.filter((q) => isVisible(q, answers));

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>페르소나 생성 도우미</Text>
      <Text style={styles.hint}>
        후보를 탭하면 답으로 반영돼요. 직접 입력하거나 비워둬도 됩니다.
      </Text>
      {visibleQuestions.map((q) => (
        <DynamicQuestion
          key={q.key}
          question={q}
          candidates={candidates[q.key]}
          value={answers[q.key]}
          onAnswer={onAnswer}
        />
      ))}
      <TouchableOpacity style={styles.nextBtn} onPress={onNext} accessibilityRole="button">
        <Text style={styles.nextText}>다음</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.zinc900, marginBottom: 4 },
  hint: { fontSize: 13, color: COLORS.zinc500, marginBottom: 12 },
  nextBtn: {
    backgroundColor: COLORS.violet600,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  nextText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
