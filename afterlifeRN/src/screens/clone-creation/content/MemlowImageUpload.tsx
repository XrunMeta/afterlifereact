import { v_889fad } from "../../../stores/dialogStore";
import v_a3453e, { v_5ab095 } from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_cf9c33, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';
import { v_e0c5af } from './pickImageSource';
import v_100dc2 from './CropImageModal';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const [v_04e790, v_43f854] = v_5ab095<{ uri: string; width: number; height: number } | null>(null);
  const v_d32efd = v_f04727.rightsAcknowledged ?? false;

  const v_c70f06 = async (v_520fa9) => {
    const v_07fb2e = await v_e0c5af(v_520fa9, v_8d41d7);
    if (v_07fb2e) v_43f854(v_07fb2e);
  };

  const v_62ae11 = () => {
    v_889fad(v_8d41d7('create.image.sourceTitle'), undefined, [
      { text: v_8d41d7('create.image.sourceCamera'), onPress: () => v_c70f06(true) },
      { text: v_8d41d7('create.image.sourceLibrary'), onPress: () => v_c70f06(false) },
      { text: v_8d41d7('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View style={v_d81136.wrap}>
      <Text style={v_d81136.note}>{v_8d41d7('create.image.memlowNote')}</Text>
      <TouchableOpacity style={v_d81136.preview} onPress={v_62ae11}>
        {v_f04727.imageFile ? (
          <Image source={{ uri: v_f04727.imageFile }} style={v_d81136.img} />
        ) : (
          <>
            <Feather name="image" size={32} color={v_1bfbd0.zinc400} />
            <Text style={v_d81136.hint}>{v_8d41d7('create.image.memlowSelectHint')}</Text>
          </>
        )}
      </TouchableOpacity>
      {v_f04727.imageFile && (
        <TouchableOpacity
          style={v_d81136.rightsRow}
          onPress={() => v_b187d9({ rightsAcknowledged: !v_d32efd })}
        >
          <Feather
            name={v_d32efd ? 'check-square' : 'square'}
            size={18}
            color={v_d32efd ? v_1bfbd0.violet600 : v_1bfbd0.zinc400}
          />
          <Text style={v_d81136.rightsText}>
            {v_8d41d7('create.image.memlowRights')}
          </Text>
        </TouchableOpacity>
      )}
      <CropImageModal
        visible={!!v_04e790}
        source={v_04e790}
        onCancel={() => v_43f854(null)}
        onConfirm={(v_cd1446) => {
          v_b187d9({ imageFile: v_cd1446, rightsAcknowledged: false });
          v_43f854(null);
        }}
      />
    </View>
  );
}

v_b0de9c.validate = (d: v_c2a674): boolean =>
  !v_d5dda0.imageFile || Boolean(v_d5dda0.rightsAcknowledged);

const v_922cea = v_b0de9c as typeof v_b0de9c & {
  validate: (d: v_c2a674) => boolean;
};
export default v_922cea;

const v_d81136 = v_472849.create({
  wrap: { gap: 12 },
  note: { fontSize: 13, color: v_1bfbd0.zinc600 },
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
  img: { width: '100%', height: '100%' },
  hint: { marginTop: 8, color: v_1bfbd0.zinc500, textAlign: 'center', paddingHorizontal: 12 },
  rightsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightsText: { fontSize: 13, color: v_1bfbd0.zinc700, flex: 1 },
});
