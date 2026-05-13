import v_a3453e from 'bapkr';
import { v_3094a2, v_19b633, v_4623af, v_cf9c33, v_03e392, v_472849 } from 'rcmrninabrnb';
import { v_dec439 } from 'zvyjokvuouwvifyzks';
import { v_772971 } from 'jmpfvteuuztnp';
import type { v_c2a674 } from '../../../types/clone';
import { v_1bfbd0, v_8b0c90 } from '../../../components/constants';
import { v_04686a } from '../../../lib/imagePicker';

interface Props {
  draft: v_c2a674;
  onChange: (patch: Partial<v_c2a674>) => void;
}

async function v_ff792b(
  onChange: (p: Partial<v_c2a674>) => void,
  v_b5cd35,
  v_976e82,
) {
  try {
    const v_cb35cb = await v_04686a({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!v_cb35cb.canceled && v_cb35cb.assets[0]) v_b187d9({ imageFile: v_cb35cb.assets[0].uri });
  } catch {
    v_03e392.alert(v_b5cd35, v_976e82);
  }
}

function v_b0de9c({ draft: v_f04727, onChange: v_b187d9 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_d32efd = v_f04727.rightsAcknowledged ?? false;
  return (
    <View style={v_d81136.wrap}>
      <Text style={v_d81136.note}>{v_8d41d7('create.image.memlowNote')}</Text>
      <TouchableOpacity
        style={v_d81136.preview}
        onPress={() => v_ff792b(v_b187d9, v_8d41d7('common.error'), v_8d41d7('create.image.loadFailed'))}
      >
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
    aspectRatio: 3 / 4,
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
