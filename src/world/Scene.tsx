import { Suspense } from 'react'
import { Grass } from './Grass'
import { Fence } from './Fence'
import { CobblePath } from './Path'
import { FieldSky } from './FieldSky'

/** Horizon / haze tint matched to the atmospheric sky. */
const HORIZON = '#c8e6f8'

export function Scene() {
  return (
    <>
      <color attach="background" args={[HORIZON]} />
      <fog attach="fog" args={[HORIZON, 60, 160]} />

      <Suspense fallback={null}>
        <FieldSky />
      </Suspense>

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[40, 35, 20]}
        intensity={0.85}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        color="#ffe8c8"
      />
      <hemisphereLight args={['#8ec4e8', '#5a7a48', 0.45]} />

      <Grass />
      <CobblePath />
      <Fence />
    </>
  )
}

