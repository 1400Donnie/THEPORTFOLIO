import { Edges } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Group } from 'three'
import type { Project } from '../data/projects'
import { projects } from '../data/projects'

const EDGE = '#111111'
const WINDOW = '#141a22'

function makePixelTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 64,
  repeat: [number, number] = [1, 1],
) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat[0], repeat[1])
  return texture
}

type PixelMaps = {
  stone: THREE.CanvasTexture
  plaster: THREE.CanvasTexture
  wood: THREE.CanvasTexture
  moss: THREE.CanvasTexture
  shingle: THREE.CanvasTexture
}

let mapsCache: PixelMaps | null = null

function getPixelMaps(): PixelMaps {
  if (mapsCache) return mapsCache

  const stone = makePixelTexture((ctx, size) => {
    const cols = ['#3a4a5c', '#2f3d4f', '#455868', '#334456']
    ctx.fillStyle = '#7a8a9a'
    ctx.fillRect(0, 0, size, size)
    const brickW = 8
    const brickH = 6
    for (let y = 0; y < size; y += brickH) {
      const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2
      for (let x = -brickW; x < size + brickW; x += brickW) {
        ctx.fillStyle = cols[Math.abs(x + y) % cols.length]
        ctx.fillRect(x + offset + 1, y + 1, brickW - 2, brickH - 2)
      }
    }
  }, 64, [2, 2])

  const plaster = makePixelTexture((ctx, size) => {
    ctx.fillStyle = '#6d7580'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#5c646e' : '#7a828c'
      ctx.fillRect(
        Math.floor(Math.random() * size),
        Math.floor(Math.random() * size),
        1 + (i % 3),
        1 + (i % 2),
      )
    }
  }, 64, [2, 2])

  const wood = makePixelTexture((ctx, size) => {
    ctx.fillStyle = '#4a2e1a'
    ctx.fillRect(0, 0, size, size)
    for (let x = 0; x < size; x += 4) {
      ctx.fillStyle = x % 8 === 0 ? '#3a2414' : '#5c3a22'
      ctx.fillRect(x, 0, 3, size)
    }
  }, 64, [1, 1])

  const moss = makePixelTexture((ctx, size) => {
    ctx.fillStyle = '#2f6b28'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#3f8f35' : i % 3 === 1 ? '#245820' : '#4aa03a'
      ctx.fillRect(
        Math.floor(Math.random() * size),
        Math.floor(Math.random() * size),
        2 + (i % 3),
        2 + (i % 2),
      )
    }
  }, 64, [2, 1])

  const shingle = makePixelTexture((ctx, size) => {
    ctx.fillStyle = '#3d2414'
    ctx.fillRect(0, 0, size, size)
    for (let y = 0; y < size; y += 5) {
      const offset = (y / 5) % 2 === 0 ? 0 : 4
      for (let x = -8; x < size + 8; x += 8) {
        ctx.fillStyle = (x + y) % 16 === 0 ? '#2a1810' : '#4a2e1a'
        ctx.fillRect(x + offset + 1, y + 1, 6, 3)
      }
    }
  }, 64, [3, 2])

  mapsCache = { stone, plaster, wood, moss, shingle }
  return mapsCache
}

function PixelBox({
  args,
  position,
  rotation,
  map,
  castShadow = true,
}: {
  args: [number, number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  map?: THREE.Texture
  castShadow?: boolean
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow>
      <boxGeometry args={args} />
      <meshLambertMaterial map={map} />
      <Edges color={EDGE} threshold={12} />
    </mesh>
  )
}

function WindowPane({
  position,
  size = [0.55, 0.7, 0.08] as [number, number, number],
  framed = true,
}: {
  position: [number, number, number]
  size?: [number, number, number]
  framed?: boolean
}) {
  const maps = getPixelMaps()
  return (
    <group position={position}>
      {framed && (
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[size[0] + 0.12, size[1] + 0.12, 0.06]} />
          <meshLambertMaterial map={maps.wood} />
          <Edges color={EDGE} threshold={15} />
        </mesh>
      )}
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial color={WINDOW} />
        <Edges color={EDGE} threshold={15} />
      </mesh>
    </group>
  )
}

function MossTuft({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.22, 0.28, 0.14]} />
      <meshLambertMaterial color="#3f8f35" />
    </mesh>
  )
}

function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <boxGeometry args={[0.45, 0.55, 0.35]} />
      <meshLambertMaterial color="#2f6b28" />
      <Edges color={EDGE} threshold={20} />
    </mesh>
  )
}

function GabledRoof({
  width,
  depth,
  y,
  mossy = false,
}: {
  width: number
  depth: number
  y: number
  mossy?: boolean
}) {
  const maps = getPixelMaps()
  const map = mossy ? maps.moss : maps.shingle
  const slabZ = depth * 0.28
  const slabD = depth * 0.58
  return (
    <group>
      <PixelBox
        args={[width, 0.14, slabD]}
        position={[0, y, slabZ]}
        rotation={[0.52, 0, 0]}
        map={map}
      />
      <PixelBox
        args={[width, 0.14, slabD]}
        position={[0, y, -slabZ]}
        rotation={[-0.52, 0, 0]}
        map={map}
      />
      <MossTuft position={[-width * 0.2, y + 0.35, 0]} />
      <MossTuft position={[width * 0.15, y + 0.4, 0.05]} />
    </group>
  )
}

function WellMesh() {
  const maps = getPixelMaps()

  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.55, 12]} />
        <meshLambertMaterial color="#4a9a40" />
        <Edges color={EDGE} threshold={20} />
      </mesh>

      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.15, 1.7, 10]} />
        <meshLambertMaterial map={maps.stone} />
        <Edges color={EDGE} threshold={18} />
      </mesh>

      <mesh position={[0, 1.72, 0]} castShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.18, 10]} />
        <meshLambertMaterial color="#7a8490" />
        <Edges color={EDGE} threshold={18} />
      </mesh>

      <mesh position={[0, 1.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 12]} />
        <meshBasicMaterial color="#1a222c" />
      </mesh>

      <mesh position={[-0.95, 2.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 2.2, 6]} />
        <meshLambertMaterial map={maps.wood} />
        <Edges color={EDGE} threshold={15} />
      </mesh>
      <mesh position={[0.95, 2.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 2.2, 6]} />
        <meshLambertMaterial map={maps.wood} />
        <Edges color={EDGE} threshold={15} />
      </mesh>

      <mesh position={[0, 3.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 2.05, 6]} />
        <meshLambertMaterial map={maps.wood} />
        <Edges color={EDGE} threshold={15} />
      </mesh>

      <mesh position={[0, 3.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.35, 8]} />
        <meshLambertMaterial color="#a89068" />
        <Edges color={EDGE} threshold={15} />
      </mesh>

      <mesh position={[0, 2.55, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.15, 5]} />
        <meshLambertMaterial color="#a89068" />
      </mesh>

      <PixelBox args={[1.4, 0.08, 0.35]} position={[0.15, 1.88, 0.35]} map={maps.wood} />

      <mesh position={[0.35, 2.05, 0.35]} castShadow>
        <cylinderGeometry args={[0.16, 0.14, 0.28, 8]} />
        <meshLambertMaterial color="#3d2414" />
        <Edges color={EDGE} threshold={15} />
      </mesh>
      <mesh position={[0.35, 2.22, 0.35]}>
        <torusGeometry args={[0.12, 0.02, 4, 10, Math.PI]} />
        <meshLambertMaterial color="#6a7078" />
      </mesh>

      <GabledRoof width={2.3} depth={2.0} y={3.85} mossy />

      <Bush position={[1.05, 0.35, 0.7]} scale={0.85} />
      <Bush position={[-0.95, 0.3, 0.75]} scale={0.7} />
      <mesh position={[0.85, 1.8, 0.15]}>
        <boxGeometry args={[0.08, 0.9, 0.35]} />
        <meshLambertMaterial color="#3f8f35" />
      </mesh>
    </group>
  )
}

function BuildingMesh({ kind }: { kind: Project['kind'] }) {
  const maps = useMemo(() => getPixelMaps(), [])

  switch (kind) {
    case 'tower':
      return (
        <group>
          <PixelBox args={[3.4, 11.5, 3.4]} position={[0, 5.75, 0]} map={maps.stone} />
          <PixelBox args={[3.7, 0.35, 3.7]} position={[0, 11.7, 0]} map={maps.moss} />
          <WindowPane position={[0, 3.0, 1.72]} />
          <WindowPane position={[0, 5.6, 1.72]} />
          <WindowPane position={[0, 8.2, 1.72]} />
          <Bush position={[1.9, 0.3, 1.6]} />
          <Bush position={[-1.8, 0.28, 1.5]} scale={0.8} />
          <MossTuft position={[0.6, 11.95, 0.4]} />
        </group>
      )

    case 'cottage':
      return (
        <group>
          <PixelBox args={[5.2, 3.3, 4.4]} position={[0, 1.65, 0]} map={maps.plaster} />
          <GabledRoof width={5.8} depth={4.8} y={4.05} mossy />
          <WindowPane position={[-1.4, 1.85, 2.22]} />
          <WindowPane position={[1.4, 1.85, 2.22]} />
          <PixelBox args={[0.9, 1.6, 0.1]} position={[0, 0.85, 2.22]} map={maps.wood} />
          <Bush position={[-2.6, 0.3, 2.0]} />
          <Bush position={[2.7, 0.28, 1.9]} scale={0.9} />
          <mesh position={[2.0, 2.4, -1.6]} castShadow>
            <cylinderGeometry args={[0.35, 0.4, 1.4, 8]} />
            <meshLambertMaterial map={maps.stone} />
            <Edges color={EDGE} threshold={15} />
          </mesh>
        </group>
      )

    case 'barn':
      return (
        <group>
          <PixelBox args={[8.2, 3.8, 4.8]} position={[0, 1.9, 0]} map={maps.wood} />
          <GabledRoof width={8.8} depth={5.2} y={4.45} />
          <WindowPane position={[-2.4, 2.1, 2.42]} size={[1.0, 1.15, 0.08]} />
          <WindowPane position={[2.4, 2.1, 2.42]} size={[1.0, 1.15, 0.08]} />
          <PixelBox args={[1.6, 2.4, 0.12]} position={[0, 1.25, 2.42]} map={maps.wood} />
          <Bush position={[-4.2, 0.3, 2.2]} scale={1.1} />
          <Bush position={[4.3, 0.28, 2.1]} />
        </group>
      )

    case 'well':
      return <WellMesh />

    case 'gallery':
      return (
        <group>
          <PixelBox args={[7.2, 0.25, 4.4]} position={[0, 0.12, 0]} map={maps.stone} />
          <PixelBox args={[6.6, 2.2, 3.8]} position={[0, 1.35, 0]} map={maps.plaster} />
          <PixelBox args={[7.6, 0.22, 4.6]} position={[0, 2.6, 0]} map={maps.moss} />
          {([-3.3, 3.3] as const).map((x) =>
            ([-1.7, 1.7] as const).map((z) => (
              <PixelBox
                key={`${x}-${z}`}
                args={[0.38, 2.7, 0.38]}
                position={[x, 1.35, z]}
                map={maps.wood}
              />
            )),
          )}
          <WindowPane position={[-1.6, 1.4, 1.92]} size={[1.1, 1.0, 0.08]} />
          <WindowPane position={[1.6, 1.4, 1.92]} size={[1.1, 1.0, 0.08]} />
          <Bush position={[-3.8, 0.3, 2.2]} />
          <MossTuft position={[1.2, 2.85, 0.6]} />
        </group>
      )

    case 'workshop':
      return (
        <group>
          <PixelBox args={[5.6, 3.5, 4.2]} position={[0, 1.75, 0]} map={maps.stone} />
          <GabledRoof width={6.0} depth={4.6} y={4.15} />
          <mesh position={[2.1, 4.6, -0.7]} castShadow>
            <cylinderGeometry args={[0.45, 0.5, 2.0, 8]} />
            <meshLambertMaterial map={maps.stone} />
            <Edges color={EDGE} threshold={15} />
          </mesh>
          <PixelBox args={[0.7, 0.25, 0.7]} position={[2.1, 5.7, -0.7]} map={maps.moss} />
          <WindowPane position={[0, 1.95, 2.12]} size={[1.3, 1.05, 0.08]} />
          <PixelBox args={[1.0, 1.8, 0.1]} position={[-1.6, 0.95, 2.12]} map={maps.wood} />
          <Bush position={[-2.9, 0.3, 2.0]} />
          <Bush position={[2.8, 0.28, 2.1]} scale={0.85} />
        </group>
      )

    case 'archive':
      return (
        <group>
          <PixelBox args={[2.4, 5.6, 2.4]} position={[0, 2.8, 0]} map={maps.plaster} />
          <GabledRoof width={2.9} depth={2.8} y={6.05} mossy />
          <WindowPane position={[0, 2.1, 1.22]} size={[0.5, 0.65, 0.08]} />
          <WindowPane position={[0, 3.6, 1.22]} size={[0.5, 0.65, 0.08]} />
          <WindowPane position={[0, 5.0, 1.22]} size={[0.45, 0.55, 0.08]} />
          <PixelBox args={[0.7, 1.4, 0.08]} position={[0, 0.75, 1.22]} map={maps.wood} />
          <Bush position={[1.3, 0.28, 1.1]} scale={0.75} />
          <Bush position={[-1.25, 0.26, 1.0]} scale={0.65} />
        </group>
      )
  }
}

function Building({ project }: { project: Project }) {
  const root = useRef<Group>(null)
  const isWell = project.kind === 'well'

  useLayoutEffect(() => {
    root.current?.traverse((obj) => {
      obj.userData.projectId = project.id
    })
  }, [project.id])

  return (
    <group
      ref={root}
      position={project.position}
      rotation={[0, project.rotation, 0]}
      userData={{ projectId: project.id }}
    >
      <BuildingMesh kind={project.kind} />
      <mesh position={[0, isWell ? 2 : 3, 0]}>
        <boxGeometry args={isWell ? [3.5, 5, 3.5] : [7, 10, 7]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function Buildings() {
  const list = useMemo(() => projects, [])

  return (
    <group>
      {list.map((project) => (
        <Building key={project.id} project={project} />
      ))}
    </group>
  )
}
