import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_472849 } from 'rcmrninabrnb';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_390fcc } from 'xpfgrcdafpntkgxfmgxpxnedjkvmtc';
import type { v_2b51a5 } from '../../navigation/types';
import v_556baf from '../../components/ui/SafeView';
import v_570c34 from '../../components/ui/SafeScrollView';
import v_258c1c from '../../components/common/PageHeader';
import v_1a40c4 from '../../components/ui/Button';
import { v_194498 } from '../../stores/cloneStore';
import v_922cea from './content/MemlowImageUpload';
import v_a6e1ad from './content/DefaultImageUpload';

import { v_1bfbd0, v_9b1a04 } from '../../components/constants';
import { v_7d2692 } from '../../api/files';
import { v_ab4719 } from '../../api/clones';
import { v_1ed7d9 } from '../../stores/authStore';

type Props = { navigation: v_390fcc<v_2b51a5, 'Step3'> };

export default function v_3d9025({ navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_f04727 = v_194498(v_fd5f43 => v_fd5f43.creationDraft);
  const v_5795de = v_194498(v_fd5f43 => v_fd5f43.setCreationDraft);
  const v_2ca7e0 = v_1ed7d9(v_fd5f43 => v_fd5f43.accessToken);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_b94c69 = v_f04727.cloneType === 'memlow' ? v_922cea : v_a6e1ad;
  const v_04fddf = v_b94c69.validate(v_f04727);

  const v_420661 = async () => {
    if (v_cb66b4) return;

    if (v_f04727.avatarFileId) {
      v_c65f5d.navigate('Step4');
      return;
    }
    if (!v_f04727.imageFile || !v_2ca7e0) {
      v_c65f5d.navigate('Step4');
      return;
    }
    v_ee9ec1(true);
    try {
      const v_40a923 = v_f04727.imageFile.split('.').pop()?.toLowerCase() ?? '';
      const v_b66751 =
        v_40a923 === 'png' ? 'image/png'
        : v_40a923 === 'webp' ? 'image/webp'
        : 'image/jpeg';
      const v_57ac81 = await v_7d2692(v_2ca7e0, v_f04727.imageFile, {
        purpose: 'clone_avatar',
        mimeType: v_b66751,
        fileName: `avatar.${v_40a923 || 'jpg'}`,
      });

      let v_04211c;
      try {
        const v_94abbb = await v_ab4719(v_2ca7e0, {
          kind: 'idle_video',
          src_file_id: v_57ac81.id,
          ...(v_f04727.idleEngine ? { engine: v_f04727.idleEngine } : {}),
        });
        v_04211c = v_94abbb.job_id;
        console.log('[Step3] idle_video job created:', v_04211c);
      } catch (v_b5cdf2) {
        console.warn('[Step3] idle_video job failed (ignored):', v_b5cdf2);
      }
      v_5795de({
        avatarFileId: v_57ac81.id,
        avatarUrl: v_57ac81.url,
        ...(v_04211c ? { idleVideoJobId: v_04211c } : {}),
      });
    } catch (v_9b4b36) {
      console.warn('[Step3] avatar upload failed (ignored):', v_9b4b36);
    } finally {
      v_ee9ec1(false);
      v_c65f5d.navigate('Step4');
    }
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title={v_8d41d7("create.stepTitles.3")}
        showBackButton
        onBackPress={() => {

          v_c65f5d.getParent()?.navigate("HomeTab" as never);
        }}
      />
      <SafeScrollView contentContainerStyle={v_d81136.content} showBottomBackground={false}>
        <Content draft={v_f04727} onChange={v_5795de} />
      </SafeScrollView>
      <View style={v_d81136.bottomBar}>
        <Button
          title={v_cb66b4 ? v_8d41d7("create.submitting", { defaultValue: "잠시만요..." }) : v_8d41d7("create.next")}
          onPress={v_420661}
          disabled={!v_04fddf || v_cb66b4}
        />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({

  content: {
    paddingHorizontal: v_9b1a04.large,
    paddingTop: 48,
    paddingBottom: v_9b1a04.large,
  },
  bottomBar: { padding: v_9b1a04.large, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc100 },
});
