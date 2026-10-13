import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import { v_19b633, v_472849 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import v_e775af from '../../../components/ui/TextField';
import { v_96d757, v_6c3f29 } from '../../../api/clones';
import { v_1bfbd0, v_843035, v_9b1a04 } from '../../../components/constants';

const v_f10496 = 500;

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'reserved';

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export default function v_805cd1({ value: v_3b402b, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_37e2fc, v_c0325f] = v_5ab095(false);
  const [v_e2299a, v_77197d] = v_5ab095<Availability>('idle');

  const v_5e2959 = v_e662ae('');

  const v_2f361a = v_3b402b.trim();
  const v_b6f6e4 = v_2f361a.length > 0 ? v_96d757(v_2f361a) : null;

  v_c4deb2(() => {
    if (v_2f361a.length === 0 || v_b6f6e4) {
      v_77197d('idle');
      return;
    }
    v_77197d('checking');
    v_5e2959.current = v_2f361a;
    const v_cb36b1 = setTimeout(async () => {
      try {
        const v_8f00b9 = await v_6c3f29(v_2f361a);
        if (v_5e2959.current !== v_2f361a) return;
        if (v_8f00b9.available) v_77197d('available');
        else if (v_8f00b9.reason === 'reserved') v_77197d('reserved');
        else v_77197d('taken');
      } catch {

        if (v_5e2959.current === v_2f361a) v_77197d('idle');
      }
    }, v_f10496);
    return () => clearTimeout(v_cb36b1);
  }, [v_2f361a, v_b6f6e4]);

  const v_74dc8b =
    v_37e2fc && v_b6f6e4
      ? v_b6f6e4
      : v_e2299a === 'taken'
        ? v_8d41d7('create.username.taken', { defaultValue: '이미 사용중인 아이디예요. 다른 아이디를 입력해주세요.' })
        : v_e2299a === 'reserved'
          ? v_8d41d7('create.username.reserved', { defaultValue: '예약된 아이디입니다. 다른 아이디를 입력해주세요.' })
          : undefined;

  return (
    <>
      <TextField
        placeholder={v_8d41d7('create.basicInfo.usernamePlaceholder')}
        value={v_3b402b}
        onChangeText={v_b187d9}
        onBlur={() => v_c0325f(true)}
        autoCapitalize="none"
        autoCorrect={false}
        errorText={v_74dc8b}
      />
      {!v_74dc8b && v_e2299a === 'checking' ? (
        <Text style={v_d81136.hint}>{v_8d41d7('create.username.checking', { defaultValue: '아이디 확인 중…' })}</Text>
      ) : null}
      {!v_74dc8b && v_e2299a === 'available' ? (
        <Text style={v_d81136.ok}>{v_8d41d7('create.username.available', { defaultValue: '사용할 수 있는 아이디예요.' })}</Text>
      ) : null}
    </>
  );
}

export function v_af8c0b(v_556427): boolean {
  const v_ceb55a = v_556427?.trim() ?? '';
  return v_ceb55a.length > 0 && v_96d757(v_ceb55a) === null;
}

const v_d81136 = v_472849.create({
  hint: {
    marginTop: v_9b1a04.small / 2,
    fontSize: 12,
    color: v_1bfbd0.mutedText,
    fontFamily: v_843035.regular,
  },
  ok: {
    marginTop: v_9b1a04.small / 2,
    fontSize: 12,
    color: v_1bfbd0.success,
    fontFamily: v_843035.medium,
  },
});
