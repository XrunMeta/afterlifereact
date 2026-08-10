

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

import type { PersonaQuestion } from '../../types/clone';

import { translateQuestion, translateOption } from '../../lib/questionI18n';

type Props = {
  navigation: NativeStackNavigationProp<CreateStackParamList, 'PersonaAssistant'>;
};

const AI_AVATAR_SRC = require('../../../assets/images/symbol.png');

function isVisible(q: PersonaQuestion, answers: Record<string, string>): boolean {
  if (!q.showWhen) return true;
  return Object.entries(q.showWhen).every(
    ([refKey, refVal]) => (answers[refKey] ?? '').includes(refVal),
  );
}

type SystemPhase = 'name' | 'username';

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

  const AI_NAME = t('create.assistant.aiName', { defaultValue: '클론 생성 도우미' });
  const SYS_PROMPTS: Record<SystemPhase, string> = {
    name: t('create.assistant.promptName', {
      defaultValue:
        '안녕하세요! 클론 생성 도우미입니다.\n\n지금 생성하는 클론의 이름이 뭔가요?\n평소에 부르던 이름이나 별명도 좋아요.',
    }),
    username: t('create.assistant.promptUsername', {
      defaultValue:
        '@아이디는 어떻게 할까요?\n영문 소문자, 숫자, _ 만 가능해요. 비워두시면 자동으로 만들어드릴게요!',
    }),
  };
  const SYS_PLACEHOLDERS: Record<SystemPhase, string> = {
    name: t('create.assistant.placeholderName', { defaultValue: '예: 별이, 할머니, 모리' }),
    username: t('create.assistant.placeholderUsername', {
      defaultValue: '예: starry_kim (비워두면 자동 생성)',
    }),
  };
  const SYS_ACK: Record<SystemPhase, string> = {
    name: t('create.assistant.ackName', { defaultValue: '좋아요, 잘 기억해뒀어요!' }),
    username: t('create.assistant.ackUsername', { defaultValue: '확인했어요! 다음 질문이에요.' }),
  };
  const DYNAMIC_ACK = t('create.assistant.ackDynamic', { defaultValue: '좋아요!' });
  const BTN_CUSTOM = t('create.assistant.btnCustom', { defaultValue: '직접 입력' });
  const BTN_SKIP = t('create.assistant.btnSkip', { defaultValue: '건너뛰기' });

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

  const SYS_STEP = 0.05;      
  const SCHEMA_BASE = 0.15;   
  const TEXT_WEIGHT = 4;      
  const CHOICE_WEIGHT = 1;    

  const rawProgress = useMemo(() => {

    if (phase === 'init' || phase === 'sys:name') return 0;
    if (phase === 'sys:username') return SYS_STEP;                          
    if (phase === 'done') return 1;

    if (phase.startsWith('schema:') && currentVisibleIdx !== null) {
      const visible = visibleSchemaQuestions;
      const weightOf = (q: PersonaQuestion) =>
        q.type === 'text' ? TEXT_WEIGHT : CHOICE_WEIGHT;
      const totalW = visible.reduce((sum, q) => sum + weightOf(q), 0);
      if (totalW <= 0) return SCHEMA_BASE;

      const doneW = visible
        .slice(0, currentVisibleIdx)
        .reduce((sum, q) => sum + weightOf(q), 0);
      return Math.min(1, SCHEMA_BASE + (1 - SCHEMA_BASE) * (doneW / totalW));
    }

    return SCHEMA_BASE; 
  }, [phase, currentVisibleIdx, visibleSchemaQuestions]);

  const [displayProgress, setDisplayProgress] = useState(0);
  useEffect(() => {
    setDisplayProgress((prev) => Math.max(prev, rawProgress));
  }, [rawProgress]);

  const progressPct = Math.round(displayProgress * 100);

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
        await pushAi(
          t('create.assistant.allDone', { defaultValue: '다 들었어요! 이제 다음 단계로 갈게요.' }),
          undefined,
          500,
        );
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
        const merged = [...new Set([...forced, ...cands])].slice(0, 5);
        buttons = merged.length > 0 ? [...merged, BTN_CUSTOM] : [BTN_CUSTOM];
      }
      if (q.type === 'fixed_choice' && (q.optional !== false)) {
        buttons = [...buttons, BTN_SKIP];
      }

      setPhase(`schema:${idx}`);

      await pushAi(translateQuestion(q.label), buttons.length > 0 ? buttons : undefined);
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

  const handleSchemaQuickReply = useCallback(
    async (msgId: string, q: PersonaQuestion, value: string) => {
      if (currentVisibleIdx === null) return;
      markReplied(msgId);

      if (value === BTN_SKIP) {

        pushUser(t('create.assistant.userSkip', { defaultValue: '(건너뛰기)' }));

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

      if (value === BTN_CUSTOM) {

        markReplied(msgId);
        await pushAi(
          t('create.assistant.askCustomInput', { defaultValue: '직접 입력해 주세요!' }),
          undefined,
          300,
        );

        return;
      }

      pushUser(translateOption(value));
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
        pushUser(
          t('create.assistant.usernameAutoDerived', {
            derived,
            defaultValue: `(빈 칸 — ${derived} 로 자동 생성)`,
          }),
        );
        answersRef.current.username = derived;
        setCreationDraft({ username: derived });
        setInput('');
        await pushAi(SYS_ACK.username, undefined, 400);

        const qs = await loadSchema();
        const loaded = qs ?? [];
        setQuestions(loaded);
        await askSchemaQuestion(0, loaded);
        return;
      }
      const raw = text.toLowerCase();
      if (!/^[a-z0-9_]+$/.test(raw)) {
        showAlert(
          t('create.assistant.usernameFormatTitle', { defaultValue: '아이디 형식 오류' }),
          t('create.assistant.usernameFormatMsg', { defaultValue: '영문 소문자, 숫자, _ 만 사용 가능해요.' }),
        );
        return;
      }
      if (raw.length < 3) {
        showAlert(
          t('create.assistant.usernameLengthTitle', { defaultValue: '아이디 길이' }),
          t('create.assistant.usernameTooShortMsg', { defaultValue: '아이디는 3자 이상이어야 해요.' }),
        );
        return;
      }
      if (raw.length > 30) {
        showAlert(
          t('create.assistant.usernameLengthTitle', { defaultValue: '아이디 길이' }),
          t('create.assistant.usernameTooLongMsg', { defaultValue: '아이디는 30자 이하여야 해요.' }),
        );
        return;
      }
      setCheckingUsername(true);
      try {
        const r = await checkCloneUsername(raw);
        if (!r.available) {
          let msg = t('create.assistant.usernameInUse', {
            defaultValue: '이미 사용중인 아이디예요. 다른 걸 입력해주세요.',
          });
          if (r.reason === 'reserved')
            msg = t('create.assistant.usernameReserved', {
              defaultValue: '예약된 아이디입니다. 다른 아이디를 입력해주세요.',
            });
          else if (r.reason === 'invalid')
            msg = t('create.assistant.usernameInvalid', {
              defaultValue: '아이디 형식이 올바르지 않아요.',
            });
          showAlert(
            t('create.assistant.usernameUnavailableTitle', { defaultValue: '사용할 수 없는 아이디' }),
            msg,
          );
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
    if (phase.startsWith('schema:') && currentVisibleIdx !== null) {
      const visible = questions.filter((q) =>
        isVisible(q, answersRef.current.schemaAnswers),
      );
      const q = visible[currentVisibleIdx];
      if (q?.type === 'text')
        return t('create.assistant.placeholderText', { defaultValue: '자유롭게 입력해 주세요...' });
      if (q?.type === 'gemma_choice')
        return t('create.assistant.placeholderCustom', { defaultValue: '직접 입력...' });
    }
    return t('create.assistant.placeholderDefault', { defaultValue: '답변을 입력하세요...' });
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
    if (phase.startsWith('schema:')) {

      return input.trim().length > 0;
    }
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
        {}
        <View style={{ width: 38 }} />
        <View style={s.headerCenter}>
          <View style={s.headerAvatar}>
            <Image source={AI_AVATAR_SRC} style={s.headerAvatarImg} resizeMode="contain" />
          </View>
          <Text style={s.headerName}>{AI_NAME}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {}
      <View style={s.progressCard}>
        <View style={s.progressTopRow}>
          <View style={s.progressLabelRow}>
            <Feather name="zap" size={15} color="#f97316" />
            <Text style={s.progressLabel}>{t('chat.trainingLabel')}</Text>
          </View>
          <Text style={s.progressPct}>{progressPct}%</Text>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={s.progressHint}>{t('chat.trainingHint')}</Text>
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

                          if (phase.startsWith('schema:') && currentVisibleIdx !== null) {
                            const visible = questions.filter((q) =>
                              isVisible(q, answersRef.current.schemaAnswers),
                            );
                            const q = visible[currentVisibleIdx];
                            if (q) await handleSchemaQuickReply(m.id, q, qr);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        {}
                        <Text style={s.quickReplyText}>{translateOption(qr)}</Text>
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
          <View style={s.inputWrap}>
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

  inputWrap: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc100,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
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

  progressCard: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.zinc50,
    borderWidth: 1,
    borderColor: COLORS.zinc100,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: COLORS.zinc900 },
  progressPct: { fontSize: 14, fontWeight: '700', color: COLORS.zinc900 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.zinc200,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#f97316',
  },
  progressHint: { fontSize: 12, color: COLORS.zinc500, marginTop: 8 },
});

void SIZES;
