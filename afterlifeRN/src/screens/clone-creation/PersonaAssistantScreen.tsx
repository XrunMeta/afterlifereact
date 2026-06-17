

import { v_889fad } from '../../stores/dialogStore';
import v_a3453e, {
  v_de06a3,
  v_c4deb2,
  v_df9f57,
  v_e662ae,
  v_5ab095,
} from 'bapkr';
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_79c4f2,
  v_4623af,
  v_326be8,
  v_e767d1,
  v_0e1f26,
  v_122070,
  v_39a996,
  v_cf9c33,
} from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_e0068c } from 'vvfgtwbmdpbnvhtfbtbgudicfmpscw';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_390fcc } from 'xpfgrcdafpntkgxfmgxpxnedjkvmtc';
import type { v_2b51a5 } from '../../navigation/types';

import v_556baf from '../../components/ui/SafeView';
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from '../../components/constants';
import { v_194498 } from '../../stores/cloneStore';
import { v_1ed7d9 } from '../../stores/authStore';
import {
  v_6c3f29,
  v_b55477,
  v_61a853,
  v_4bf019,
  v_be66ca,
} from '../../api/clones';
import { v_0a40d6 } from '../../mocks/cloneTypeCatalog';
import type { v_c8af29 } from '../../types/clone';

type Props = {
  navigation: v_390fcc<v_2b51a5, 'PersonaAssistant'>;
};

const v_291e91 = '클론 생성 도우미';
const v_90ef75 = require('../../../assets/images/symbol.png');

function v_a7e583(q: v_c8af29, v_00da68): boolean {
  if (!v_ab6401.showWhen) return true;
  return Object.entries(v_ab6401.showWhen).every(
    ([v_3c1d34, v_441249]) => (v_00da68[v_3c1d34] ?? '').includes(v_441249),
  );
}

type SystemPhase = 'name' | 'username' | 'relation';

const v_d09784 = {
  name: '안녕하세요! 클론 생성 도우미입니다.\n\n지금 생성하는 클론의 이름이 뭔가요?\n평소에 부르던 이름이나 별명도 좋아요.',
  username:
    '@아이디는 어떻게 할까요?\n영문 소문자, 숫자, _ 만 가능해요. 비워두시면 자동으로 만들어드릴게요!',
  relation: '어떤 관계인가요?\n아래에서 선택해 주세요.',
};

const v_3aa5d1 = {
  name: '예: 별이, 할머니, 모리',
  username: '예: starry_kim (비워두면 자동 생성)',
  relation: '',
};

const v_0ac987 = {
  name: '좋아요, 잘 기억해뒀어요!',
  username: '확인했어요! 다음 질문이에요.',
  relation: '알겠어요! 계속 진행할게요.',
};

const v_035037 = '좋아요!';

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;

  quickReplies?: string[];

  replied?: boolean;
}

let v_964ae2 = 1;
function v_ceee18(): string {
  return `m${v_964ae2++}_${Date.now()}`;
}

const v_aabc29 = new Set([
  'ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP',
  'ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ',
]);

export default function v_8e5b58({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_fa56e0, v_41d55d] = v_5ab095<ChatMessage[]>([]);
  const [v_6bae32, v_a0f9c4] = v_5ab095(false);
  const [v_bbda62, v_c31db7] = v_5ab095('');
  const v_5ca6b8 = v_e662ae<v_122070>(null);

  const [v_ab4803, v_ae4844] = v_5ab095<string>('init');
  const [v_c3519b, v_54a43f] = v_5ab095<v_c8af29[]>([]);
  const [v_6f7c85, v_0a8beb] = v_5ab095<Record<string, string[]>>({});
  const v_03f138 = v_e662ae<{
    name: string;
    username: string;
    relation: string;
    schemaAnswers: Record<string, string>;
  }>({ name: '', username: '', relation: '', schemaAnswers: {} });
  const [v_dff7ca, v_08d488] = v_5ab095(false);

  const v_19911c = v_e662ae(false);

  const v_d00943 = v_e662ae(false);

  const v_91af42 = v_de06a3(() => {
    requestAnimationFrame(() => {
      v_5ca6b8.current?.scrollToEnd({ animated: true });
    });
  }, []);
  v_c4deb2(() => {
    v_91af42();
  }, [v_fa56e0, v_6bae32, v_91af42]);

  const v_f76640 = v_de06a3(
    async (v_9b6134, v_530e77, v_76e791 = 600) => {
      v_a0f9c4(true);
      await new Promise<void>((v_cb35cb) => setTimeout(v_cb35cb, v_76e791));
      v_a0f9c4(false);
      const v_badeaf = { id: v_ceee18(), role: 'ai', text: v_9b6134 };
      if (v_530e77 && v_530e77.length > 0) v_badeaf.quickReplies = v_530e77;
      v_41d55d((v_ba2215) => [...v_ba2215, v_badeaf]);
    },
    [],
  );

  const v_13cb29 = v_de06a3((v_9b6134) => {
    v_41d55d((v_ba2215) => [...v_ba2215, { id: v_ceee18(), role: 'user', text: v_9b6134 }]);
  }, []);

  const v_add3fa = v_de06a3((v_878e48) => {
    v_41d55d((v_ba2215) =>
      v_ba2215.map((v_35f85c) => (v_35f85c.id === v_878e48 ? { ...v_35f85c, replied: true } : v_35f85c)),
    );
  }, []);

  const v_089434 = (() => {
    if (!v_ab4803.startsWith('schema:')) return null;
    return parseInt(v_ab4803.slice('schema:'.length), 10);
  })();

  const v_7b2d16 = v_df9f57(() => {
    return v_c3519b.filter((v_ab6401) =>
      v_a7e583(v_ab6401, v_03f138.current.schemaAnswers),
    );
  }, [v_c3519b]);

  const v_d776c4 = (() => {
    if (v_089434 === null) return null;
    return v_089434;
  })();

  const v_cd9adb = 0.05;      
  const v_29bce9 = 0.15;   
  const v_c0a2da = 4;      
  const v_d53712 = 1;    

  const v_ba35ae = v_df9f57(() => {

    if (v_ab4803 === 'init' || v_ab4803 === 'sys:name') return 0;
    if (v_ab4803 === 'sys:username') return v_cd9adb;                          
    if (v_ab4803 === 'sys:relation' || v_ab4803 === 'sys:relation-custom') return v_cd9adb * 2; 
    if (v_ab4803 === 'done') return 1;

    if (v_ab4803.startsWith('schema:') && v_d776c4 !== null) {
      const v_cf55be = v_7b2d16;
      const v_02d66b = (q: v_c8af29) =>
        v_ab6401.type === 'text' ? v_c0a2da : v_d53712;
      const v_78d11f = v_cf55be.reduce((v_dce0a8, v_ab6401) => v_dce0a8 + v_02d66b(v_ab6401), 0);
      if (v_78d11f <= 0) return v_29bce9;

      const v_09394e = v_cf55be
        .slice(0, v_d776c4)
        .reduce((v_dce0a8, v_ab6401) => v_dce0a8 + v_02d66b(v_ab6401), 0);
      return Math.min(1, v_29bce9 + (1 - v_29bce9) * (v_09394e / v_78d11f));
    }

    return v_29bce9; 
  }, [v_ab4803, v_d776c4, v_7b2d16]);

  const [v_9339ad, v_9a6920] = v_5ab095(0);
  v_c4deb2(() => {
    v_9a6920((v_ba2215) => Math.max(v_ba2215, v_ba35ae));
  }, [v_ba35ae]);

  const v_dc2799 = Math.round(v_9339ad * 100);

  const v_fdd1bf = v_de06a3(async () => {
    if (v_19911c.current || !v_2ca7e0) return;
    v_19911c.current = true;
    try {
      const v_779914 = v_03f138.current;
      const v_727031 = {
        name: v_779914.name,
        relation: v_779914.relation,
        age: v_779914.schemaAnswers['age'],
        gender: v_779914.schemaAnswers['gender'],
        mbti: v_779914.schemaAnswers['mbti'],
      };
      const v_43c42e = await v_4bf019(v_2ca7e0, v_727031);
      v_0a8beb(v_43c42e);
    } catch {

    }
  }, [v_2ca7e0]);

  const v_45c941 = v_de06a3(async () => {
    if (v_d00943.current || !v_2ca7e0) return;
    v_d00943.current = true;
    try {
      const v_212049 = await v_61a853(v_2ca7e0);
      v_54a43f(v_212049);
      return v_212049;
    } catch {
      v_54a43f([]);
      return [] as v_c8af29[];
    }
  }, [v_2ca7e0]);

  const v_cdd940 = v_de06a3(
    async (v_e86ad8, qs: v_c8af29[]) => {

      const v_cf55be = v_212049.filter((v_ab6401) =>
        v_a7e583(v_ab6401, v_03f138.current.schemaAnswers),
      );
      if (v_e86ad8 >= v_cf55be.length) {

        v_ae4844('done');
        await v_f76640('다 들었어요! 이제 다음 단계로 갈게요.', undefined, 500);
        setTimeout(() => {
          const v_00da68 = v_03f138.current;
          v_5795de({
            name: v_00da68.name,
            username: v_00da68.username,
            relation: v_00da68.relation as never,
            personaAnswers: v_00da68.schemaAnswers,
          });

          if (v_2ca7e0) {
            v_be66ca(v_2ca7e0, {
              name: v_00da68.name,
              relation: v_00da68.relation,
              personaAnswers: v_00da68.schemaAnswers,
            })
              .then((v_456484) => {
                if (v_456484) v_5795de({ description: v_456484 });
              })
              .catch(() => {});
          }

          v_c65f5d.navigate('Step5');
        }, 800);
        return;
      }

      const v_ab6401 = v_cf55be[v_e86ad8]!;

      if (v_ab6401.key === 'personality_core' && !v_19911c.current) {
        await v_fdd1bf();
      }

      let v_3d694a = [];
      if (v_ab6401.type === 'fixed_choice') {
        v_3d694a = v_ab6401.options ?? [];
      } else if (v_ab6401.type === 'gemma_choice') {
        const v_cc1380 = v_6f7c85[v_ab6401.key] ?? [];

        const v_9bfd73 = v_ab6401.options_include ?? [];
        const v_2b7a6d = [...new Set([...v_9bfd73, ...v_cc1380])].slice(0, 3);
        v_3d694a = v_2b7a6d.length > 0 ? [...v_2b7a6d, '직접 입력'] : ['직접 입력'];
      }
      if (v_ab6401.type === 'fixed_choice' && (v_ab6401.optional !== false)) {
        v_3d694a = [...v_3d694a, '건너뛰기'];
      }

      v_ae4844(`schema:${v_e86ad8}`);
      await v_f76640(v_ab6401.label, v_3d694a.length > 0 ? v_3d694a : undefined);
    },
    [v_6f7c85, v_fdd1bf, v_c65f5d, v_f76640, v_5795de],
  );

  v_c4deb2(() => {
    let v_2008a4 = false;
    (async () => {
      if (v_2008a4) return;
      v_ae4844('sys:name');
      await v_f76640(v_d09784.name, undefined, 400);
    })();
    return () => {
      v_2008a4 = true;
    };

  }, []);

  const v_a5d353 = v_de06a3(
    async (v_878e48, v_5c27e3, v_fac795) => {
      if (v_ab4803 !== 'sys:relation') return;
      v_add3fa(v_878e48);
      v_13cb29(v_fac795);

      if (v_5c27e3 === 'other') {
        v_ae4844('sys:relation-custom');
        await v_f76640('어떤 관계인지 직접 알려주세요!', undefined, 300);
        return;
      }

      v_03f138.current.relation = v_5c27e3;
      await v_f76640(v_0ac987.relation, undefined, 400);

      const v_212049 = await v_45c941();
      const v_bf751c = v_212049 ?? [];
      v_54a43f(v_bf751c);
      await v_cdd940(0, v_bf751c);
    },
    [v_ab4803, v_add3fa, v_13cb29, v_f76640, v_45c941, v_cdd940],
  );

  const v_a369bd = v_de06a3(
    async (v_878e48, q: v_c8af29, v_3b402b) => {
      if (v_d776c4 === null) return;
      v_add3fa(v_878e48);

      if (v_3b402b === '건너뛰기') {

        v_13cb29('(건너뛰기)');

        const v_a448ad = { ...v_03f138.current.schemaAnswers };
        delete v_a448ad[v_ab6401.key];

        for (const v_4936c6 of v_c3519b) {
          if (v_4936c6.showWhen && !v_a7e583(v_4936c6, v_a448ad) && v_a448ad[v_4936c6.key] !== undefined) {
            delete v_a448ad[v_4936c6.key];
          }
        }
        v_03f138.current.schemaAnswers = v_a448ad;
        await v_f76640(v_035037, undefined, 300);
        await v_cdd940(v_d776c4 + 1, v_c3519b);
        return;
      }

      if (v_3b402b === '직접 입력') {

        v_add3fa(v_878e48);
        await v_f76640('직접 입력해 주세요!', undefined, 300);

        return;
      }

      v_13cb29(v_3b402b);
      const v_ba2215 = { ...v_03f138.current.schemaAnswers, [v_ab6401.key]: v_3b402b };

      for (const v_4936c6 of v_c3519b) {
        if (v_4936c6.showWhen && !v_a7e583(v_4936c6, v_ba2215) && v_ba2215[v_4936c6.key] !== undefined) {
          delete v_ba2215[v_4936c6.key];
        }
      }
      v_03f138.current.schemaAnswers = v_ba2215;

      await v_f76640(v_035037, undefined, 300);
      await v_cdd940(v_d776c4 + 1, v_c3519b);
    },
    [v_d776c4, v_add3fa, v_13cb29, v_f76640, v_c3519b, v_cdd940],
  );

  const v_fbb22a = v_de06a3(async () => {
    const v_9b6134 = v_bbda62.trim();

    if (v_ab4803 === 'sys:name') {
      if (!v_9b6134) return;
      v_13cb29(v_9b6134);
      v_03f138.current.name = v_9b6134;
      v_c31db7('');
      await v_f76640(v_0ac987.name, undefined, 400);
      v_ae4844('sys:username');
      await v_f76640(v_d09784.username, undefined, 500);
      return;
    }

    if (v_ab4803 === 'sys:username') {
      if (v_dff7ca) return;
      if (v_9b6134.length === 0) {

        const v_bff627 = v_b55477(v_03f138.current.name || 'user');
        v_13cb29(`(빈 칸 — ${v_bff627} 로 자동 생성)`);
        v_03f138.current.username = v_bff627;
        v_5795de({ username: v_bff627 });
        v_c31db7('');
        await v_f76640(v_0ac987.username, undefined, 400);

        const v_e2c296 = v_0a40d6.map((v_cb35cb) => v_8d41d7(v_cb35cb.label));
        v_ae4844('sys:relation');
        await v_f76640(v_d09784.relation, v_e2c296, 500);
        return;
      }
      const v_479f05 = v_9b6134.toLowerCase();
      if (!/^[a-z0-9_]+$/.test(v_479f05)) {
        v_889fad('아이디 형식 오류', '영문 소문자, 숫자, _ 만 사용 가능해요.');
        return;
      }
      if (v_479f05.length < 3) {
        v_889fad('아이디 길이', '아이디는 3자 이상이어야 해요.');
        return;
      }
      if (v_479f05.length > 30) {
        v_889fad('아이디 길이', '아이디는 30자 이하여야 해요.');
        return;
      }
      v_08d488(true);
      try {
        const v_cb35cb = await v_6c3f29(v_479f05);
        if (!v_cb35cb.available) {
          let v_badeaf = '이미 사용중인 아이디예요. 다른 걸 입력해주세요.';
          if (v_cb35cb.reason === 'reserved') v_badeaf = '예약된 아이디입니다. 다른 아이디를 입력해주세요.';
          else if (v_cb35cb.reason === 'invalid') v_badeaf = '아이디 형식이 올바르지 않아요.';
          v_889fad('사용할 수 없는 아이디', v_badeaf);
          return;
        }
      } catch {

      } finally {
        v_08d488(false);
      }
      v_13cb29(`@${v_479f05}`);
      v_03f138.current.username = v_479f05;
      v_5795de({ username: v_479f05 });
      v_c31db7('');
      await v_f76640(v_0ac987.username, undefined, 400);
      const v_e2c296 = v_0a40d6.map((v_cb35cb) => v_8d41d7(v_cb35cb.label));
      v_ae4844('sys:relation');
      await v_f76640(v_d09784.relation, v_e2c296, 500);
      return;
    }

    if (v_ab4803 === 'sys:relation-custom') {
      if (!v_9b6134) return;
      v_13cb29(v_9b6134);
      v_03f138.current.relation = v_9b6134;
      v_c31db7('');
      await v_f76640(v_0ac987.relation, undefined, 400);
      const v_212049 = await v_45c941();
      const v_bf751c = v_212049 ?? [];
      v_54a43f(v_bf751c);
      await v_cdd940(0, v_bf751c);
      return;
    }

    if (v_ab4803.startsWith('schema:') && v_d776c4 !== null) {
      if (!v_9b6134) return;
      const v_cf55be = v_c3519b.filter((v_ab6401) =>
        v_a7e583(v_ab6401, v_03f138.current.schemaAnswers),
      );
      const v_ab6401 = v_cf55be[v_d776c4];
      if (!v_ab6401) return;
      v_13cb29(v_9b6134);
      v_c31db7('');

      const v_ba2215 = { ...v_03f138.current.schemaAnswers, [v_ab6401.key]: v_9b6134 };

      for (const v_4936c6 of v_c3519b) {
        if (v_4936c6.showWhen && !v_a7e583(v_4936c6, v_ba2215) && v_ba2215[v_4936c6.key] !== undefined) {
          delete v_ba2215[v_4936c6.key];
        }
      }
      v_03f138.current.schemaAnswers = v_ba2215;

      await v_f76640(v_035037, undefined, 300);
      await v_cdd940(v_d776c4 + 1, v_c3519b);
    }
  }, [
    v_ab4803,
    v_bbda62,
    v_dff7ca,
    v_d776c4,
    v_c3519b,
    v_13cb29,
    v_f76640,
    v_5795de,
    v_8d41d7,
    v_cdd940,
    v_45c941,
  ]);

  const v_bc9d5f = (() => {
    if (v_ab4803 === 'sys:name') return true;
    if (v_ab4803 === 'sys:username') return true;
    if (v_ab4803 === 'sys:relation') return false; 
    if (v_ab4803 === 'sys:relation-custom') return true; 
    if (!v_ab4803.startsWith('schema:') || v_d776c4 === null) return false;
    const v_cf55be = v_c3519b.filter((v_ab6401) =>
      v_a7e583(v_ab6401, v_03f138.current.schemaAnswers),
    );
    const v_ab6401 = v_cf55be[v_d776c4];
    if (!v_ab6401) return false;

    return v_ab6401.type === 'text' || v_ab6401.type === 'gemma_choice';
  })();

  const v_064334 = (() => {
    if (v_ab4803 === 'sys:name') return v_3aa5d1.name;
    if (v_ab4803 === 'sys:username') return v_3aa5d1.username;
    if (v_ab4803 === 'sys:relation-custom') return '예: 할아버지, 은사님, 동료...';
    if (v_ab4803.startsWith('schema:') && v_d776c4 !== null) {
      const v_cf55be = v_c3519b.filter((v_ab6401) =>
        v_a7e583(v_ab6401, v_03f138.current.schemaAnswers),
      );
      const v_ab6401 = v_cf55be[v_d776c4];
      if (v_ab6401?.type === 'text') return '자유롭게 입력해 주세요...';
      if (v_ab6401?.type === 'gemma_choice') return '직접 입력...';
    }
    return '답변을 입력하세요...';
  })();

  const v_f05841 = (() => {
    if (v_ab4803.startsWith('schema:') && v_d776c4 !== null) {
      const v_cf55be = v_c3519b.filter((v_ab6401) =>
        v_a7e583(v_ab6401, v_03f138.current.schemaAnswers),
      );
      const v_ab6401 = v_cf55be[v_d776c4];
      return v_ab6401?.type === 'text';
    }
    return false;
  })();

  const v_9399bb = (() => {
    if (v_ab4803 === 'sys:username') return !v_dff7ca; 
    if (v_ab4803 === 'sys:name') return v_bbda62.trim().length > 0;
    if (v_ab4803 === 'sys:relation-custom') return v_bbda62.trim().length > 0;
    if (v_ab4803.startsWith('schema:')) {

      return v_bbda62.trim().length > 0;
    }
    return false;
  })();

  const v_199303 = v_ab4803 === 'done';

  const v_c7ac57 = () => {
    v_0e1f26.dismiss();
    v_c65f5d.goBack();
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      {}
      <View style={[v_fd5f43.header, { paddingTop: v_033e14.top + 6 }]}>
        {}
        <View style={{ width: 38 }} />
        <View style={v_fd5f43.headerCenter}>
          <View style={v_fd5f43.headerAvatar}>
            <Image source={v_90ef75} style={v_fd5f43.headerAvatarImg} resizeMode="contain" />
          </View>
          <Text style={v_fd5f43.headerName}>{v_291e91}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {}
      <View style={v_fd5f43.progressCard}>
        <View style={v_fd5f43.progressTopRow}>
          <View style={v_fd5f43.progressLabelRow}>
            <Feather name="zap" size={15} color="#f97316" />
            <Text style={v_fd5f43.progressLabel}>{v_8d41d7('chat.trainingLabel')}</Text>
          </View>
          <Text style={v_fd5f43.progressPct}>{v_dc2799}%</Text>
        </View>
        <View style={v_fd5f43.progressTrack}>
          <View style={[v_fd5f43.progressFill, { width: `${v_dc2799}%` }]} />
        </View>
        <Text style={v_fd5f43.progressHint}>{v_8d41d7('chat.trainingHint')}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={v_326be8.OS === 'ios' ? 'padding' : 'height'}
      >
        {}
        <ScrollView
          ref={v_5ca6b8}
          style={v_fd5f43.chatScroll}
          contentContainerStyle={v_fd5f43.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {v_fa56e0.map((v_35f85c, v_ebec57) => {
            const v_0bd65d = v_35f85c.role === 'ai';
            const v_ba2215 = v_fa56e0[v_ebec57 - 1];
            const v_80139d = v_ba2215 && v_ba2215.role === v_35f85c.role;
            return (
              <View key={v_35f85c.id}>
                <View style={[v_fd5f43.row, v_0bd65d ? v_fd5f43.rowAi : v_fd5f43.rowUser]}>
                  {v_0bd65d && (
                    <View style={[v_fd5f43.avatar, v_80139d && { opacity: 0 }]}>
                      <Image
                        source={v_90ef75}
                        style={v_fd5f43.avatarImg}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <View
                    style={[
                      v_fd5f43.bubble,
                      v_0bd65d ? v_fd5f43.bubbleAi : v_fd5f43.bubbleUser,
                      v_0bd65d && v_80139d && { marginLeft: 0 },
                    ]}
                  >
                    <Text style={v_0bd65d ? v_fd5f43.bubbleTextAi : v_fd5f43.bubbleTextUser}>{v_35f85c.text}</Text>
                  </View>
                </View>
                {}
                {v_0bd65d && v_35f85c.quickReplies && !v_35f85c.replied && (
                  <View style={v_fd5f43.quickReplyRow}>
                    {v_35f85c.quickReplies.map((v_44aa64) => (
                      <TouchableOpacity
                        key={v_44aa64}
                        style={v_fd5f43.quickReplyBtn}
                        onPress={async () => {

                          if (v_ab4803 === 'sys:relation') {

                            const v_ba70d8 = v_0a40d6.find((v_cb35cb) => v_8d41d7(v_cb35cb.label) === v_44aa64);
                            await v_a5d353(v_35f85c.id, v_ba70d8 ? v_ba70d8.id : v_44aa64, v_44aa64);
                          } else if (v_ab4803.startsWith('schema:') && v_d776c4 !== null) {
                            const v_cf55be = v_c3519b.filter((v_ab6401) =>
                              v_a7e583(v_ab6401, v_03f138.current.schemaAnswers),
                            );
                            const v_ab6401 = v_cf55be[v_d776c4];
                            if (v_ab6401) await v_a369bd(v_35f85c.id, v_ab6401, v_44aa64);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={v_fd5f43.quickReplyText}>{v_44aa64}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          {}
          {v_6bae32 && (
            <View style={[v_fd5f43.row, v_fd5f43.rowAi]}>
              <View style={v_fd5f43.avatar}>
                <Image source={v_90ef75} style={v_fd5f43.avatarImg} resizeMode="contain" />
              </View>
              <View style={[v_fd5f43.bubble, v_fd5f43.bubbleAi, v_fd5f43.typingBubble]}>
                <ActivityIndicator size="small" color={v_1bfbd0.zinc500} />
              </View>
            </View>
          )}
        </ScrollView>

        {}
        {v_bc9d5f && (
          <View style={v_fd5f43.inputWrap}>
            <View style={v_fd5f43.inputBar}>
              <TextInput
                style={[v_fd5f43.input, v_f05841 && v_fd5f43.inputMultiline]}
                value={v_bbda62}
                onChangeText={(v_81e2ef) => {
                  if (v_ab4803 === 'sys:username') {
                    v_c31db7(v_81e2ef.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  } else {
                    v_c31db7(v_81e2ef);
                  }
                }}
                placeholder={v_064334}
                placeholderTextColor={v_1bfbd0.zinc400}
                multiline={v_f05841}
                maxLength={v_f05841 ? 500 : 40}

                autoCapitalize={v_ab4803 === 'sys:username' ? 'none' : 'sentences'}
                autoCorrect={v_ab4803 !== 'sys:username'}
                autoComplete={v_ab4803 === 'sys:username' ? 'off' : undefined}
                keyboardType={v_ab4803 === 'sys:username' ? 'visible-password' : 'default'}
                textContentType={v_ab4803 === 'sys:username' ? 'none' : undefined}
                editable={!v_199303 && !v_dff7ca}
                returnKeyType={v_f05841 ? 'default' : 'send'}
                onSubmitEditing={v_f05841 ? undefined : v_fbb22a}
                blurOnSubmit={!v_f05841}
              />
              <TouchableOpacity
                style={[v_fd5f43.sendBtn, !v_9399bb && v_fd5f43.sendBtnDisabled]}
                onPress={v_fbb22a}
                disabled={!v_9399bb}
                activeOpacity={0.85}
              >
                {v_dff7ca ? (
                  <ActivityIndicator size="small" color={v_1bfbd0.white} />
                ) : (
                  <Feather name="send" size={18} color={v_9399bb ? v_1bfbd0.white : v_1bfbd0.zinc400} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
    backgroundColor: v_1bfbd0.white,
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
    backgroundColor: v_1bfbd0.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImg: { width: 22, height: 22 },
  headerName: { fontSize: 15, fontWeight: '700', color: v_1bfbd0.zinc900 },

  chatScroll: { flex: 1, backgroundColor: '#f1f5f9' },
  chatContent: { paddingVertical: 16, paddingHorizontal: 12, gap: 8 },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, maxWidth: '100%' },
  rowAi: { justifyContent: 'flex-start' },
  rowUser: { justifyContent: 'flex-end' },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: v_1bfbd0.white,
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
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  bubbleUser: {
    backgroundColor: v_1bfbd0.violet600,
    borderTopRightRadius: 4,
    marginLeft: 8,
  },
  bubbleTextAi: { fontSize: 14, color: v_1bfbd0.zinc900, lineHeight: 20 },
  bubbleTextUser: { fontSize: 14, color: v_1bfbd0.white, lineHeight: 20 },
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
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: v_1bfbd0.violet200,
    backgroundColor: v_1bfbd0.white,
  },
  quickReplyText: { fontSize: 13, color: v_1bfbd0.violet600, fontWeight: '500' },

  inputWrap: {
    backgroundColor: v_1bfbd0.white,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: v_1bfbd0.white,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.zinc50,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  inputMultiline: { paddingTop: 10 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: v_1bfbd0.zinc200 },

  progressCard: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: v_1bfbd0.zinc50,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc100,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: v_1bfbd0.zinc900 },
  progressPct: { fontSize: 14, fontWeight: '700', color: v_1bfbd0.zinc900 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: v_1bfbd0.zinc200,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#f97316',
  },
  progressHint: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 8 },
});

void v_9b1a04;
