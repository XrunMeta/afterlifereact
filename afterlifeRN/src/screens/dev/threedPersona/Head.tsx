import React, { useCallback, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Camera, FilamentView, Light, useFilamentContext, useModel } from 'react-native-filament'
import type { ISharedValue } from 'react-native-worklets-core'

import { MORPH_COUNT } from './config'

interface Props {

  weights: ISharedValue<number[]>

  onLoaded: (targetNames: string[]) => void
  onError: (message: string) => void
}

export function Head({ weights, onLoaded, onError }: Props) {
  const model = useModel(require('../../../../assets/3d/head_9053.glb'))
  const { renderableManager } = useFilamentContext()

  const asset = model.state === 'loaded' ? model.asset : undefined

  useEffect(() => {
    if (asset == null) return
    try {

      const names: string[] = []
      for (const entity of asset.getRenderableEntities()) {
        const count = asset.getMorphTargetCountAt(entity)
        for (let i = 0; i < count; i++) {
          names.push(asset.getMorphTargetNameAt(entity, i))
        }
      }
      onLoaded(names)
    } catch (error) {
      onError(`morph target 조회 실패: ${String(error)}`)
    }
  }, [asset, onLoaded, onError])

  const renderCallback = useCallback(() => {
    'worklet'
    if (asset == null) return

    const source = weights.value
    const current = [source[0], source[1], source[2], source[3], source[4]]

    const entities = asset.getRenderableEntities()
    for (let i = 0; i < entities.length; i++) {
      renderableManager.setMorphWeights(entities[i], current, 0)
    }
  }, [asset, renderableManager, weights])

  return (
    <FilamentView style={styles.view} renderCallback={renderCallback}>
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

export const NEUTRAL_WEIGHTS: number[] = new Array(MORPH_COUNT).fill(0)

const styles = StyleSheet.create({
  view: { flex: 1 },
})
