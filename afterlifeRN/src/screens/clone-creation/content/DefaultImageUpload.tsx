import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_cf9c33, v_472849, v_700696 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';
import { v_e0c5af } from './pickImageSource';
import v_100dc2 from './CropImageModal';
import v_e0961f from './CaptureWithGuideModal';
import v_c7021f from './ImageSourceSheet';
import { v_cf3fbd } from './t208ImagePick';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

const { width: v_e9b8fb, height: v_dc9e8c } = v_700696.get('window');
const v_227667 = Math.min(v_dc9e8c * 0.38, (v_e9b8fb - 48) * 2);
const v_77054d = v_227667 / 2;

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_04e790, v_43f854] = v_5ab095<{ uri: string; width: number; height: number } | null>(null);
  const [v_30246f, v_9bce1c] = v_5ab095(false);
  const [v_4b3863, v_902cfc] = v_5ab095(true);
  const [v_cf89e5, v_a5c9cf] = v_5ab095(false);

  const v_e1c60b = async () => {
    const v_07fb2e = await v_e0c5af(false, v_8d41d7);
    if (v_07fb2e) v_43f854(v_07fb2e);
  };

  const v_62ae11 = () => {
    v_a5c9cf(true);
  };

  return (
    <View style={v_d81136.wrap}>
      <TouchableOpacity
        style={[v_d81136.preview, v_f04727.imageFile ? v_d81136.previewBordered : null]}
        onPress={v_62ae11}
        activeOpacity={0.9}
      >
        {v_f04727.imageFile ? (
          <>
            <Image source={{ uri: v_f04727.imageFile }} style={v_d81136.previewImg} resizeMode="cover" />
            {}
            <View style={v_d81136.gridOverlay} pointerEvents="none">
              <View style={[v_d81136.gridLine, v_d81136.gridLineV, { left: '33.33%' }]} />
              <View style={[v_d81136.gridLine, v_d81136.gridLineV, { left: '66.66%' }]} />
              <View style={[v_d81136.gridLine, v_d81136.gridLineH, { top: '33.33%' }]} />
              <View style={[v_d81136.gridLine, v_d81136.gridLineH, { top: '66.66%' }]} />
            </View>
          </>
        ) : (
          <View style={v_d81136.emptyInner}>
            <Feather name="image" size={32} color={v_1bfbd0.zinc400} />
            <Text style={v_d81136.hint}>
              {v_8d41d7('create.image.selectHint', { defaultValue: '사진을 선택해 주십시오' })}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {}
      <TouchableOpacity
        style={v_d81136.guideHeader}
        onPress={() => v_902cfc((v_81e2ef) => !v_81e2ef)}
        activeOpacity={0.7}
      >
        <View style={v_d81136.guideHeaderInner}>
          <View style={v_d81136.guideDivider} />
          <Text style={v_d81136.guideHeaderText}>
            {v_8d41d7('create.image.guideTitle', { defaultValue: '사진 가이드라인' })}
          </Text>
          <Feather
            name={v_4b3863 ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={v_1bfbd0.zinc700}
            style={v_d81136.guideChevron}
          />
          <View style={v_d81136.guideDivider} />
        </View>
      </TouchableOpacity>

      {v_4b3863 && (
        <>
          <Text style={v_d81136.guideBody}>
            {v_8d41d7('create.image.guideBody', {
              defaultValue:
                '비율을 적절히 유지하려면 양쪽 어깨가 프레임에 완전히 들어오는 정면, 어깨 위쪽을 향한 세로 방향 사진을 사용하십시오. 1024×1024 이상의 이미지가 가장 적합합니다.',
            })}
          </Text>

          <View style={v_d81136.examplesRow}>
            <View style={v_d81136.exampleCol}>
              <View style={v_d81136.exampleImgWrap}>
                <Image
                  source={require('../../../../assets/images/photo-guide-good.webp')}
                  style={v_d81136.exampleImg}
                  resizeMode="cover"
                />
                <View style={[v_d81136.exampleBadge, v_d81136.exampleBadgeGood]}>
                  <Feather name="check" size={16} color="#fff" />
                </View>
              </View>
              <Text style={v_d81136.exampleLabel}>
                {v_8d41d7('create.image.exampleGood', { defaultValue: '명확하고, 전면에 배치된' })}
              </Text>
            </View>
            <View style={v_d81136.exampleCol}>
              <View style={v_d81136.exampleImgWrap}>
                <Image
                  source={require('../../../../assets/images/photo-guide-bad.webp')}
                  style={v_d81136.exampleImg}
                  resizeMode="cover"
                />
                <View style={[v_d81136.exampleBadge, v_d81136.exampleBadgeBad]}>
                  <Feather name="x" size={16} color="#fff" />
                </View>
              </View>
              <Text style={v_d81136.exampleLabel}>
                {v_8d41d7('create.image.exampleBad', { defaultValue: '너무 클로즈업됨' })}
              </Text>
            </View>
          </View>
        </>
      )}

      <ImageSourceSheet
        visible={v_cf89e5}
        title={v_8d41d7('create.image.sourceTitle')}
        cameraLabel={v_8d41d7('create.image.sourceCamera')}
        libraryLabel={v_8d41d7('create.image.sourceLibrary')}
        cancelLabel={v_8d41d7('common.cancel')}
        onCamera={() => v_9bce1c(true)}
        onLibrary={() => { void v_e1c60b(); }}
        onClose={() => v_a5c9cf(false)}
        extraActions={v_cf3fbd({
          cancelLabel: v_8d41d7('common.cancel'),
          onApplyT208Crop: (v_cd1446) => v_b187d9({ imageFile: v_cd1446 }),
        })}
      />
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
  wrap: { gap: 16 },
  preview: {
    width: v_77054d,
    height: v_227667,
    alignSelf: 'center',
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    overflow: 'hidden',
  },
  previewBordered: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  previewImg: { width: '100%', height: '100%' },
  emptyInner: {
    ...v_472849.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  hint: {
    marginTop: 8,
    color: v_1bfbd0.zinc500,
    fontSize: 13,
    textAlign: 'center',
  },
  gridOverlay: { ...v_472849.absoluteFillObject },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.6)' },
  gridLineV: { top: 0, bottom: 0, width: 1 },
  gridLineH: { left: 0, right: 0, height: 1 },

  guideHeader: { marginTop: 4 },
  guideHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideDivider: { flex: 1, height: 1, backgroundColor: v_1bfbd0.zinc200 },
  guideHeaderText: { fontSize: 13, color: v_1bfbd0.zinc700, fontWeight: '500' },
  guideChevron: { marginLeft: -4 },

  guideBody: { fontSize: 13, color: v_1bfbd0.zinc700, lineHeight: 20, textAlign: 'center' },

  examplesRow: { flexDirection: 'row', gap: 12 },
  exampleCol: { flex: 1, alignItems: 'center', gap: 6 },
  exampleImgWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: v_8b0c90.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: v_1bfbd0.zinc100,
  },
  exampleImg: { width: '100%', height: '100%' },
  exampleBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleBadgeGood: { backgroundColor: 'rgba(34,197,94,0.9)' },
  exampleBadgeBad: { backgroundColor: 'rgba(239,68,68,0.9)' },
  exampleLabel: { fontSize: 12, color: v_1bfbd0.zinc700, textAlign: 'center' },
});
