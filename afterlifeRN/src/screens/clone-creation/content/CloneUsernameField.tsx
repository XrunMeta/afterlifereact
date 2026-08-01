import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import TextField from '../../../components/ui/TextField';
import { validateCloneUsername, checkCloneUsername } from '../../../api/clones';
import { COLORS, FONTS, SIZES } from '../../../components/constants';

const CHECK_DEBOUNCE_MS = 500;

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'reserved';

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export default function CloneUsernameField({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [touched, setTouched] = useState(false);
  const [availability, setAvailability] = useState<Availability>('idle');

  const latestQueryRef = useRef('');

  const trimmed = value.trim();
  const formatError = trimmed.length > 0 ? validateCloneUsername(trimmed) : null;

  useEffect(() => {
    if (trimmed.length === 0 || formatError) {
      setAvailability('idle');
      return;
    }
    setAvailability('checking');
    latestQueryRef.current = trimmed;
    const timer = setTimeout(async () => {
      try {
        const res = await checkCloneUsername(trimmed);
        if (latestQueryRef.current !== trimmed) return;
        if (res.available) setAvailability('available');
        else if (res.reason === 'reserved') setAvailability('reserved');
        else setAvailability('taken');
      } catch {

        if (latestQueryRef.current === trimmed) setAvailability('idle');
      }
    }, CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed, formatError]);

  const errorText =
    touched && formatError
      ? formatError
      : availability === 'taken'
        ? '이미 사용중인 아이디예요. 다른 아이디를 입력해주세요.'
        : availability === 'reserved'
          ? '예약된 아이디입니다. 다른 아이디를 입력해주세요.'
          : undefined;

  return (
    <>
      <TextField
        placeholder={t('create.basicInfo.usernamePlaceholder')}
        value={value}
        onChangeText={onChange}
        onBlur={() => setTouched(true)}
        autoCapitalize="none"
        autoCorrect={false}
        errorText={errorText}
      />
      {!errorText && availability === 'checking' ? (
        <Text style={styles.hint}>아이디 확인 중…</Text>
      ) : null}
      {!errorText && availability === 'available' ? (
        <Text style={styles.ok}>사용할 수 있는 아이디예요.</Text>
      ) : null}
    </>
  );
}

export function isCloneUsernameReady(username?: string): boolean {
  const u = username?.trim() ?? '';
  return u.length > 0 && validateCloneUsername(u) === null;
}

const styles = StyleSheet.create({
  hint: {
    marginTop: SIZES.small / 2,
    fontSize: 12,
    color: COLORS.mutedText,
    fontFamily: FONTS.regular,
  },
  ok: {
    marginTop: SIZES.small / 2,
    fontSize: 12,
    color: COLORS.success,
    fontFamily: FONTS.medium,
  },
});
