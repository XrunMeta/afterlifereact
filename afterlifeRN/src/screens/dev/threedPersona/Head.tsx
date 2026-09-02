import v_a3453e, { v_de06a3, v_c4deb2 } from 'bapkr'
import { v_472849 } from 'rcmrninabrnb'
import { v_862296, v_84881e, v_fc64b3, v_cfd06e, v_c86c88 } from 'wubwojvppqigopdenymkn'
import type { v_ffc571 } from 'fkysyevuehkssftyrtweoolhfw'

import { v_ceeae8 } from './config'

interface Props {

  weights: v_ffc571<number[]>

  onLoaded: (targetNames: string[]) => void
  onError: (message: string) => void
}

export function v_842502({ weights: v_e5c9ed, onLoaded: v_a98ec7, onError: v_c6eab8 }: Props) {
  const v_768389 = v_c86c88(require('../../../../assets/3d/head_9053.glb'))
  const { renderableManager: v_233948 } = v_cfd06e()

  const v_b76cd8 = v_768389.state === 'loaded' ? v_768389.asset : undefined

  v_c4deb2(() => {
    if (v_b76cd8 == null) return
    try {

      const v_77b1ac = []
      for (const v_887fc4 of v_b76cd8.getRenderableEntities()) {
        const v_9e8c70 = v_b76cd8.getMorphTargetCountAt(v_887fc4)
        for (let v_ebec57 = 0; v_ebec57 < v_9e8c70; v_ebec57++) {
          v_77b1ac.push(v_b76cd8.getMorphTargetNameAt(v_887fc4, v_ebec57))
        }
      }
      v_a98ec7(v_77b1ac)
    } catch (v_5e9bfe) {
      v_c6eab8(`morph target 조회 실패: ${String(v_5e9bfe)}`)
    }
  }, [v_b76cd8, v_a98ec7, v_c6eab8])

  const v_b1553d = v_de06a3(() => {
    'worklet'
    if (v_b76cd8 == null) return

    const v_04e790 = v_e5c9ed.value
    const v_275ccd = [v_04e790[0], v_04e790[1], v_04e790[2], v_04e790[3], v_04e790[4]]

    const v_df558e = v_b76cd8.getRenderableEntities()
    for (let v_ebec57 = 0; v_ebec57 < v_df558e.length; v_ebec57++) {
      v_233948.setMorphWeights(v_df558e[v_ebec57], v_275ccd, 0)
    }
  }, [v_b76cd8, v_233948, v_e5c9ed])

  return (
    <FilamentView style={v_d81136.view} renderCallback={v_b1553d}>
      {
}
      <Camera cameraPosition={[0, -0.04, 1.45]} cameraTarget={[0, -0.06, 0]} />

      {

}
      <Light type="directional" direction={[-0.4, -0.5, -1]} intensity={45_000} colorKelvin={6_500} castShadows={false} />
      <Light type="directional" direction={[0.8, -0.2, -0.6]} intensity={18_000} colorKelvin={7_500} castShadows={false} />
      <Light type="directional" direction={[0, 0.6, 0.8]} intensity={12_000} colorKelvin={5_500} castShadows={false} />
    </FilamentView>
  )
}

export const v_45df48 = new Array(v_ceeae8).fill(0)

const v_d81136 = v_472849.create({
  view: { flex: 1 },
})
