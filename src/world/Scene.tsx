import { Grass } from './Grass'
import { Fence } from './Fence'
import { CobblePath } from './Path'

export function Scene() {
  return (
    <>
      <color attach="background" args={['#c8cfd6']} />
      <fog attach="fog" args={['#c8cfd6', 28, 72]} />

      <ambientLight intensity={0.72} />
      <directionalLight
        position={[12, 22, 8]}
        intensity={0.85}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={['#dfe6ec', '#4a7a38', 0.35]} />

      <Grass />
      <CobblePath />
      <Fence />
    </>
  )
}
