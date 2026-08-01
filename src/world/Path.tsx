import { Edges, useTexture } from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'

const EDGE = '#1a120c'
const PATH_WIDTH = 2.5
const Y = 0.04

type Pt = [number, number]

/** Town paths: spawn → well, then three spokes to the houses. */
const SEGMENTS: Pt[][] = [
  [
    [0, 11],
    [0, 4],
    [0, -2],
    [0, -8],
  ],
  [
    [0, -8],
    [0, -14],
    [0, -20],
  ],
  [
    [0, -8],
    [-6, -8],
    [-12, -8],
    [-15, -8],
  ],
  [
    [0, -8],
    [6, -8],
    [12, -8],
    [15, -8],
  ],
]

function configureMap(map: THREE.Texture, repeatX: number, repeatY: number) {
  const next = map.clone()
  next.wrapS = THREE.RepeatWrapping
  next.wrapT = THREE.RepeatWrapping
  next.colorSpace = THREE.SRGBColorSpace
  next.anisotropy = 8
  next.repeat.set(repeatX, repeatY)
  next.needsUpdate = true
  return next
}

function Segment({
  a,
  b,
  map,
}: {
  a: Pt
  b: Pt
  map: THREE.Texture
}) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const length = Math.hypot(dx, dz)
  if (length < 0.01) return null

  const midX = (a[0] + b[0]) / 2
  const midZ = (a[1] + b[1]) / 2
  const angle = Math.atan2(dx, dz)

  // ~1 world unit ≈ one tile of the cobble image
  const segMap = useMemo(
    () => configureMap(map, PATH_WIDTH * 0.85, length * 0.85),
    [map, length],
  )

  return (
    <mesh
      position={[midX, Y, midZ]}
      rotation={[-Math.PI / 2, 0, -angle]}
      receiveShadow
    >
      <planeGeometry args={[PATH_WIDTH, length + 0.2]} />
      <meshStandardMaterial map={segMap} roughness={0.92} metalness={0.05} />
    </mesh>
  )
}

function Plaza({ map }: { map: THREE.Texture }) {
  const plazaMap = useMemo(() => configureMap(map, 3.8, 3.8), [map])

  return (
    <mesh position={[0, Y - 0.005, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[4.3, 24]} />
      <meshStandardMaterial map={plazaMap} roughness={0.92} metalness={0.05} />
      <Edges color={EDGE} threshold={25} />
    </mesh>
  )
}

export function CobblePath() {
  const map = useTexture('/textures/cobblestone.png')

  useLayoutEffect(() => {
    map.wrapS = THREE.RepeatWrapping
    map.wrapT = THREE.RepeatWrapping
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    map.needsUpdate = true
  }, [map])

  const pairs = useMemo(() => {
    const out: { a: Pt; b: Pt; key: string }[] = []
    SEGMENTS.forEach((seg, si) => {
      for (let i = 0; i < seg.length - 1; i++) {
        out.push({ a: seg[i], b: seg[i + 1], key: `${si}-${i}` })
      }
    })
    return out
  }, [])

  return (
    <group>
      <Plaza map={map} />
      {pairs.map(({ a, b, key }) => (
        <Segment key={key} a={a} b={b} map={map} />
      ))}
    </group>
  )
}
