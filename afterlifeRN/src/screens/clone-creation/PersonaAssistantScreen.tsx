

import { showAlert } from '../../stores/dialogStore';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CreateStackParamList } from '../../navigation/types';

import SafeView from '../../components/ui/SafeView';
import { COLORS, SIZES, RADIUS } from '../../components/constants';
import { useCloneStore } from '../../stores/cloneStore';
import { useAuthStore } from '../../stores/authStore';
import {
  checkCloneUsername,
  deriveUsernameFromName,
  getPersonaQuestions,
  personaSuggest,
  introSuggest,
} from '../../api/clones';
import { MEMLOW_RELATIONS } from '../../mocks/cloneTypeCatalog';
import type { PersonaQuestion } from '../../types/clone';

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, 'PersonaAssistant'>;
};

const AI_NAME = '페르소나 생성 도우미';
const AI_AVATAR_SRC = require('../../../assets/images/symbol.png');

function isVisible(q: PersonaQuestion, answers: Record<string, string>): boolean {
  if (!q.showWhen) return true;
  return Object.entries(q.showWhen).every(
    ([refKey, refVal]) => (answers[refKey] ?? '').includes(refVal),
  );
}

type SystemPhase = 'name' | 'username' | 'relation';

const SYS_PROMPTS: Record<SystemPhase, string> = {
  name: '안녕하세요! 페르소나 생성 도우미입니다.\n\n지금 생성하는 페르소나의 이름이 뭔가요?\n평소에 부르던 이름이나 별명도 좋아요.',
  username:
    '@아이디는 어떻게 할까요?\n영문 소문자, 숫자, _ 만 가능해요. 비워두시면 자동으로 만들어드릴게요!',
  relation: '어떤 관계인가요?\n아래에서 선택해 주세요.',
};

const SYS_PLACEHOLDERS: Record<SystemPhase, string> = {
  name: '예: 별이, 할머니, 모리',
  username: '예: starry_kim (비워두면 자동 생성)',
  relation: '',
};

const SYS_ACK: Record<SystemPhase, string> = {
  name: '좋아요, 잘 기억해뒀어요!',
  username: '확인했어요! 다음 질문이에요.',
  relation: '알겠어요! 계속 진행할게요.',
};

const DYNAMIC_ACK = '좋아요!';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;

  quickReplies?: string[];

  replied?: boolean;
}

let _seq = 1;
function newId(): string {
  return `m${_seq++}_${Date.now()}`;
}

const MBTI_SET = new Set([
  'ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP',
  'ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ',
]);

export default function PersonaAssistantScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const setCreationDraft = useCloneStore((s) => s.setCreationDraft);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const [phase, setPhase] = useState<string>('init');
  const [questions, setQuestions] = useState<PersonaQuestion[]>([]);
  const [candidates, setCandidates] = useState<Record<string, string[]>>({});
  const answersRef = useRef<{
    name: string;
    username: string;
    relation: string;
    schemaAnswers: Record<string, string>;
  }>({ name: '', username: '', relation: '', schemaAnswers: {} });
  const [checkingUsername, setCheckingUsername] = useState(false);

  const gemmaCalledRef = useRef(false);

  const schemaLoadedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, aiTyping, scrollToBottom]);

  const pushAi = useCallback(
    async (text: string, quickReplies?: string[], typingMs = 600) => {
      setAiTyping(true);
      await new Promise<void>((r) => setTimeout(r, typingMs));
      setAiTyping(false);
      const msg: ChatMessage = { id: newId(), role: 'ai', text };
      if (quickReplies && quickReplies.length > 0) msg.quickReplies = quickReplies;
      setMessages((prev) => [...prev, msg]);
    },
    [],
  );

  const pushUser = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text }]);
  }, []);

  const markReplied = useCallback((msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, replied: true } : m)),
    );
  }, []);

  const currentSchemaIdx = (() => {
    if (!phase.startsWith('schema:')) return null;
    return parseInt(phase.slice('schema:'.length), 10);
  })();

  const visibleSchemaQuestions = useMemo(() => {
    return questions.filter((q) =>
      isVisible(q, answersRef.current.schemaAnswers),
    );
  }, [questions]);

  const currentVisibleIdx = (() => {
    if (currentSchemaIdx === null) return null;
    return currentSchemaIdx;
  })();

  const fetchGemma = useCallback(async () => {
    if (gemmaCalledRef.current || !accessToken) return;
    gemmaCalledRef.current = true;
    try {
      const a = answersRef.current;
      const profile = {
        name: a.name,
        relation: a.relation,
        age: a.schemaAnswers['age'],
        gender: a.schemaAnswers['gender'],
        mbti: a.schemaAnswers['mbti'],
      };
      const result = await personaSuggest(accessToken, profile);
      setCandidates(result);
    } catch {

    }
  }, [accessToken]);

  const loadSchema = useCallback(async () => {
    if (schemaLoadedRef.current || !accessToken) return;
    schemaLoadedRef.current = true;
    try {
      const qs = await getPersonaQuestions(accessToken);
      setQuestions(qs);
      return qs;
    } catch {
      setQuestions([]);
      return [] as PersonaQuestion[];
    }
  }, [accessToken]);

  const askSchemaQuestion = useCallback(
    async (idx: number, qs: PersonaQuestion[]) => {

      const visible = qs.filter((q) =>
        isVisible(q, answersRef.current.schemaAnswers),
      );
      if (idx >= visible.length) {

        setPhase('done');
        await pushAi('다 들었어요! 이제 다음 단계로 갈게요.', undefined, 500);
        setTimeout(() => {
          const answers = answersRef.current;
          setCreationDraft({
            name: answers.name,
            username: answers.username,
            relation: answers.relation as never,
            personaAnswers: answers.schemaAnswers,
          });

          if (accessToken) {
            introSuggest(accessToken, {
              name: answers.name,
              relation: answers.relation,
              personaAnswers: answers.schemaAnswers,
            })
              .then((intro) => {
                if (intro) setCreationDraft({ description: intro });
              })
              .catch(() => {});
          }

          navigation.navigate('Step5');
        }, 800);
        return;
      }

      const q = visible[idx]!;

      if (q.key === 'personality_core' && !gemmaCalledRef.current) {
        await fetchGemma();
      }

      let buttons: string[] = [];
      if (q.type === 'fixed_choice') {
        buttons = q.options ?? [];
      } else if (q.type === 'gemma_choice') {
        const cands = candidates[q.key] ?? [];

        const forced = q.options_include ?? [];
        const merged = [...new Set([...forced, ...cands])];
        buttons = merged.length > 0 ? [...merged, '직접 입력', '건너뛰기'] : ['직접 입력', '건너뛰기'];
      }
      if (q.type === 'fixed_choice' && (q.optional !== false)) {
        buttons = [...buttons, '건너뛰기'];
      }

      if (q.type === 'text' && (q.optional !== false)) {
        buttons = ['건너뛰기'];
      }

      setPhase(`schema:${idx}`);
      await pushAi(q.label, buttons.length > 0 ? buttons : undefined);
    },
    [candidates, fetchGemma, navigation, pushAi, setCreationDraft],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setPhase('sys:name');
      await pushAi(SYS_PROMPTS.name, undefined, 400);
    })();
    return () => {
      cancelled = true;
    };

  }, []);

  const handleRelationSelect = useCallback(
    async (msgId: string, relId: string, displayLabel: string) => {
      if (phase !== 'sys:relation') return;
      markReplied(msgId);
      pushUser(displayLabel);

      if (relId === 'other') {
        setPhase('sys:relation-custom');
        await pushAi('어떤 관계인지 직접 알려주세요!', undefined, 300);
        return;
      }

      answersRef.current.relation = relId;
      await pushAi(SYS_ACK.relation, undefined, 400);

      const qs = await loadSchema();
      const loaded = qs ?? [];
      setQuestions(loaded);
      await askSchemaQuestion(0, loaded);
    },
    [phase, markReplied, pushUser, pushAi, loadSchema, askSchemaQuestion],
  );

  const handleSchemaQuickReply = useCallback(
    async (msgId: string, q: PersonaQuestion, value: string) => {
      if (currentVisibleIdx === null) return;
      markReplied(msgId);

      if (value === '건너뛰기') {

        pushUser('(건너뛰기)');

        const next = { ...answersRef.current.schemaAnswers };
        delete next[q.key];

        for (const oq of questions) {
          if (oq.showWhen && !isVisible(oq, next) && next[oq.key] !== undefined) {
            delete next[oq.key];
          }
        }
        answersRef.current.schemaAnswers = next;
        await pushAi(DYNAMIC_ACK, undefined, 300);
        await askSchemaQuestion(currentVisibleIdx + 1, questions);
        return;
      }

      if (value === '직접 입력') {

        markReplied(msgId);
        await pushAi('직접 입력해 주세요!', undefined, 300);

        return;
      }

      pushUser(value);
      const prev = { ...answersRef.current.schemaAnswers, [q.key]: value };

      for (const oq of questions) {
        if (oq.showWhen && !isVisible(oq, prev) && prev[oq.key] !== undefined) {
          delete prev[oq.key];
        }
      }
      answersRef.current.schemaAnswers = prev;

      await pushAi(DYNAMIC_ACK, undefined, 300);
      await askSchemaQuestion(currentVisibleIdx + 1, questions);
    },
    [currentVisibleIdx, markReplied, pushUser, pushAi, questions, askSchemaQuestion],
  );

  const submit = useCallback(async () => {
    const text = input.trim();

    if (phase === 'sys:name') {
      if (!text) return;
      pushUser(text);
      answersRef.current.name = text;
      setInput('');
      await pushAi(SYS_ACK.name, undefined, 400);
      setPhase('sys:username');
      await pushAi(SYS_PROMPTS.username, undefined, 500);
      return;
    }

    if (phase === 'sys:username') {
      if (checkingUsername) return;
      if (text.length === 0) {

        const derived = deriveUsernameFromName(answersRef.current.name || 'user');
        pushUser(`(빈 칸 — ${derived} 로 자동 생성)`);
        answersRef.current.username = derived;
        setCreationDraft({ username: derived });
        setInput('');
        await pushAi(SYS_ACK.username, undefined, 400);

        const relButtons = MEMLOW_RELATIONS.map((r) => t(r.label));
        setPhase('sys:relation');
        await pushAi(SYS_PROMPTS.relation, relButtons, 500);
        return;
      }
      const raw = text.toLowerCase();
      if (!/^[a-z0-9_]+$/.test(raw)) {
        showAlert('아이디 형식 오류', '영문 소문자, 숫자, _ 만 사용 가능해요.');
        return;
      }
      if (raw.length < 3) {
        showAlert('아이디 길이', '아이디는 3자 이상이어야 해요.');
        return;
      }
      if (raw.length > 30) {
        showAlert('아이디 길이', '아이디는 30자 이하여야 해요.');
        return;
      }
      setCheckingUsername(true);
      try {
        const r = await checkCloneUsername(raw);
        if (!r.available) {
          let msg = '이미 사용중인 아이디예요. 다른 걸 입력해주세요.';
          if (r.reason === 'reserved') msg = '예약된 아이디입니다. 다른 아이디를 입력해주세요.';
          else if (r.reason === 'invalid') msg = '아이디 형식이 올바르지 않아요.';
          showAlert('사용할 수 없는 아이디', msg);
          return;
        }
      } catch {

      } finally {
        setCheckingUsername(false);
      }
      pushUser(`@${raw}`);
      answersRef.current.username = raw;
      setCreationDraft({ username: raw });
      setInput('');
      await pushAi(SYS_ACK.username, undefined, 400);
      const relButtons = MEMLOW_RELATIONS.map((r) => t(r.label));
      setPhase('sys:relation');
      await pushAi(SYS_PROMPTS.relation, relButtons, 500);
      return;
    }

    if (phase === 'sys:relation-custom') {
      if (!text) return;
      pushUser(text);
      answersRef.current.relation = text;
      setInput('');
      await pushAi(SYS_ACK.relation, undefined, 400);
      const qs = await loadSchema();
      const loaded = qs ?? [];
      setQuestions(loaded);
      await askSchemaQuestion(0, loaded);
      return;
    }

    if (phase.startsWith('schema:') && currentVisibleIdx !== null) {
      if (!text) return;
      const visible = questions.filter((q) =>
        isVisible(q, answersRef.current.schemaAnswers),
      );
      const q = visible[currentVisibleIdx];
      if (!q) return;
      pushUser(text);
      setInput('');

      const prev = { ...answersRef.current.schemaAnswers, [q.key]: text };

      for (const oq of questions) {
        if (oq.showWhen && !isVisible(oq, prev) && prev[oq.key] !== undefined) {
          delete prev[oq.key];
        }
      }
      answersRef.current.schemaAnswers = prev;

      await pushAi(DYNAMIC_ACK, undefined, 300);
      await askSchemaQuestion(currentVisibleIdx + 1, questions);
    }
  }, [
    phase,
    input,
    checkingUsername,
    currentVisibleIdx,
    questions,
    pushUser,
    pushAi,
    setCreationDraft,
    t,
    askSchemaQuestion,
    loadSchema,
  ]);

  const showInput = (() => {
    if (phase === 'sys:name') return true;
    if (phase === 'sys:username') return true;
    if (phase === 'sys:relation') return false; 
    if (phase === 'sys:relation-custom') return true; 
    if (!phase.startsWith('schema:') || currentVisibleIdx === null) return false;
    const visible = questions.filter((q) =>
      isVisible(q, answersRef.current.schemaAnswers),
    );
    const q = visible[currentVisibleIdx];
    if (!q) return false;

    return q.type === 'text' || q.type === 'gemma_choice';
  })();

  const inputPlaceholder = (() => {
    if (phase === 'sys:name') return SYS_PLACEHOLDERS.name;
    if (phase === 'sys:username') return SYS_PLACEHOLDERS.username;
    if (phase === 'sys:relation-custom') return '예: 할아버지, 은사님, 동료...';
    if (phase.startsWith('schema:') && currentVisibleIdx !== null) {
      const visible = questions.filter((q) =>
        isVisible(q, answersRef.current.schemaAnswers),
      );
      const q = visible[currentVisibleIdx];
      if (q?.type === 'text') return '자유롭게 입력해 주세요...';
      if (q?.type === 'gemma_choice') return '직접 입력...';
    }
    return '답변을 입력하세요...';
  })();

  const isMultiline = (() => {
    if (phase.startsWith('schema:') && currentVisibleIdx !== null) {
      const visible = questions.filter((q) =>
        isVisible(q, answersRef.current.schemaAnswers),
      );
      const q = visible[currentVisibleIdx];
      return q?.type === 'text';
    }
    return false;
  })();

  const canSend = (() => {
    if (phase === 'sys:username') return !checkingUsername; 
    if (phase === 'sys:name') return input.trim().length > 0;
    if (phase === 'sys:relation-custom') return input.trim().length > 0;
    if (phase.startsWith('schema:')) return input.trim().length > 0;
    return false;
  })();

  const isDone = phase === 'done';

  const goBack = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  return (
    <SafeView backgroundColor={COLORS.white}>
      {}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={goBack} hitSlop={12} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={COLORS.zinc900} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.headerAvatar}>
            <Image source={AI_AVATAR_SRC} style={s.headerAvatarImg} resizeMode="contain" />
          </View>
          <Text style={s.headerName}>{AI_NAME}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {}
        <ScrollView
          ref={scrollRef}
          style={s.chatScroll}
          contentContainerStyle={s.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => {
            const isAi = m.role === 'ai';
            const prev = messages[i - 1];
            const isContinuation = prev && prev.role === m.role;
            return (
              <View key={m.id}>
                <View style={[s.row, isAi ? s.rowAi : s.rowUser]}>
                  {isAi && (
                    <View style={[s.avatar, isContinuation && { opacity: 0 }]}>
                      <Image
                        source={AI_AVATAR_SRC}
                        style={s.avatarImg}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <View
                    style={[
                      s.bubble,
                      isAi ? s.bubbleAi : s.bubbleUser,
                      isAi && isContinuation && { marginLeft: 0 },
                    ]}
                  >
                    <Text style={isAi ? s.bubbleTextAi : s.bubbleTextUser}>{m.text}</Text>
                  </View>
                </View>
                {}
                {isAi && m.quickReplies && !m.replied && (
                  <View style={s.quickReplyRow}>
                    {m.quickReplies.map((qr) => (
                      <TouchableOpacity
                        key={qr}
                        style={s.quickReplyBtn}
                        onPress={async () => {

                          if (phase === 'sys:relation') {

                            const rel = MEMLOW_RELATIONS.find((r) => t(r.label) === qr);
                            await handleRelationSelect(m.id, rel ? rel.id : qr, qr);
                          } else if (phase.startsWith('schema:') && currentVisibleIdx !== null) {
                            const visible = questions.filter((q) =>
                              isVisible(q, answersRef.current.schemaAnswers),
                            );
                            const q = visible[currentVisibleIdx];
                            if (q) await handleSchemaQuickReply(m.id, q, qr);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={s.quickReplyText}>{qr}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          {}
          {aiTyping && (
            <View style={[s.row, s.rowAi]}>
              <View style={s.avatar}>
                <Image source={AI_AVATAR_SRC} style={s.avatarImg} resizeMode="contain" />
              </View>
              <View style={[s.bubble, s.bubbleAi, s.typingBubble]}>
                <ActivityIndicator size="small" color={COLORS.zinc500} />
              </View>
            </View>
          )}
        </ScrollView>

        {}
        {showInput && (
          <View style={s.inputBar}>
            <TextInput
              style={[s.input, isMultiline && s.inputMultiline]}
              value={input}
              onChangeText={(v) => {
                if (phase === 'sys:username') {
                  setInput(v.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                } else {
                  setInput(v);
                }
              }}
              placeholder={inputPlaceholder}
              placeholderTextColor={COLORS.zinc400}
              multiline={isMultiline}
              maxLength={isMultiline ? 500 : 40}

              autoCapitalize={phase === 'sys:username' ? 'none' : 'sentences'}
              autoCorrect={phase !== 'sys:username'}
              autoComplete={phase === 'sys:username' ? 'off' : undefined}
              keyboardType={phase === 'sys:username' ? 'visible-password' : 'default'}
              textContentType={phase === 'sys:username' ? 'none' : undefined}
              editable={!isDone && !checkingUsername}
              returnKeyType={isMultiline ? 'default' : 'send'}
              onSubmitEditing={isMultiline ? undefined : submit}
              blurOnSubmit={!isMultiline}
            />
            <TouchableOpacity
              style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
              onPress={submit}
              disabled={!canSend}
              activeOpacity={0.85}
            >
              {checkingUsername ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Feather name="send" size={18} color={canSend ? COLORS.white : COLORS.zinc400} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc100,
    backgroundColor: COLORS.white,
  },
  backBtn: { padding: 8, width: 38 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: { width: 22, height: 22 },
  headerName: { fontSize: 15, fontWeight: '700', color: COLORS.zinc900 },

  chatScroll: { flex: 1, backgroundColor: '#f1f5f9' },
  chatContent: { paddingVertical: 16, paddingHorizontal: 12, gap: 8 },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, maxWidth: '100%' },
  rowAi: { justifyContent: 'flex-start' },
  rowUser: { justifyContent: 'flex-end' },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    overflow: 'hidden',
  },
  avatarImg: { width: 24, height: 24 },

  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    maxWidth: '75%',
  },
  bubbleAi: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
  },
  bubbleUser: {
    backgroundColor: COLORS.violet600,
    borderTopRightRadius: 4,
    marginLeft: 8,
  },
  bubbleTextAi: { fontSize: 14, color: COLORS.zinc900, lineHeight: 20 },
  bubbleTextUser: { fontSize: 14, color: COLORS.white, lineHeight: 20 },
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },

  quickReplyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 44, 
    paddingTop: 6,
    paddingBottom: 4,
  },
  quickReplyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.violet200,
    backgroundColor: COLORS.white,
  },
  quickReplyText: { fontSize: 13, color: COLORS.violet600, fontWeight: '500' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: 20,
    backgroundColor: COLORS.zinc50,
    fontSize: 14,
    color: COLORS.zinc900,
  },
  inputMultiline: { paddingTop: 10 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.violet600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.zinc200 },
});

void SIZES;
