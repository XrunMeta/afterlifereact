import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_cf9c33, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';
import { v_e0c5af } from './pickImageSource';
import v_100dc2 from './CropImageModal';
import v_e0961f from './CaptureWithGuideModal';
import { v_aae248 } from './t208ImagePick';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_04e790, v_43f854] = v_5ab095<{ uri: string; width: number; height: number } | null>(null);
  const [v_30246f, v_9bce1c] = v_5ab095(false);
  const v_3fa7fc = [
    v_8d41d7('create.image.guide1'),
    v_8d41d7('create.image.guide2'),
    v_8d41d7('create.image.guide3'),
  ];

  const v_e1c60b = async () => {
    const v_07fb2e = await v_e0c5af(false, v_8d41d7);
    if (v_07fb2e) v_43f854(v_07fb2e);
  };

  const v_62ae11 = () => {
    v_aae248({
      title: v_8d41d7('create.image.sourceTitle'),
      cameraLabel: v_8d41d7('create.image.sourceCamera'),
      libraryLabel: v_8d41d7('create.image.sourceLibrary'),
      cancelLabel: v_8d41d7('common.cancel'),
      onCamera: () => v_9bce1c(true),
      onLibrary: () => {
        void v_e1c60b();
      },
      onApplyT208Crop: (v_cd1446) => v_b187d9({ imageFile: v_cd1446 }),
    });
  };

  return (
    <View style={v_d81136.wrap}>
      <TouchableOpacity style={v_d81136.preview} onPress={v_62ae11}>
        {v_f04727.imageFile ? (
          <Image source={{ uri: v_f04727.imageFile }} style={v_d81136.previewImg} />
        ) : (
          <>
            <Feather name="image" size={32} color={v_1bfbd0.zinc400} />
            <Text style={v_d81136.hint}>{v_8d41d7('create.image.selectHint')}</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={v_d81136.guideTitle}>{v_8d41d7('create.image.guideTitle')}</Text>
      {v_3fa7fc.map((v_206b88, v_ebec57) => (
        <Text key={v_ebec57} style={v_d81136.guideText}>
          • {v_206b88}
        </Text>
      ))}
      <CaptureWithGuideModal
        visible={v_30246f}
        onCancel={() => v_9bce1c(false)}
        onCapture={(v_07fb2e) => {
          v_9bce1c(false);
          v_43f854(v_07fb2e);
        }}
      />
      <CropImageModal
        visible={!!v_04e790}
        source={v_04e790}
        onCancel={() => v_43f854(null)}
        onConfirm={(v_cd1446) => {
          v_b187d9({ imageFile: v_cd1446 });
          v_43f854(null);
        }}
      />
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean => Boolean(v_d5dda0.imageFile);

const v_a6e1ad = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_a6e1ad;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  preview: {
    aspectRatio: 1 / 2,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: v_1bfbd0.zinc50,
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  hint: { marginTop: 8, color: v_1bfbd0.zinc500 },
  guideTitle: { fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc700, marginTop: 12 },
  guideText: { fontSize: 12, color: v_1bfbd0.zinc600 },
});
