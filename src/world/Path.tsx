import { Edges } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

const EDGE = '#1a120c'
const PATH_WIDTH = 2.35
const Y = 0.04

function makeCobbleTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#5a5854'
  ctx.fillRect(0, 0, size, size)

  const stones = ['#6e6a64', '#585450', '#7a756e', '#4e4a46', '#66625c', '#8a847c']
  for (let y = 0; y < size; y += 8) {
    const offset = (y / 8) % 2 === 0 ? 0 : 5
    for (let x = -10; x < size + 10; x += 10) {
      const sx = x + offset + 1
      const sy = y + 1
      ctx.fillStyle = stones[(x + y * 3) % stones.length]
      ctx.fillRect(sx, sy, 8, 6)
      ctx.strokeStyle = '#3a3834'
      ctx.lineWidth = 1
      ctx.strokeRect(sx, sy, 8, 6)
      // speckles
      ctx.fillStyle = '#9a948c'
      ctx.fillRect(sx + 2, sy + 2, 1, 1)
      ctx.fillStyle = '#2e2c28'
      ctx.fillRect(sx + 5, sy + 4, 1, 1)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

type Pt = [number, number]

/** Town path graph — main street, cross streets, barn spur, well plaza. */
const SEGMENTS: Pt[][] = [
  // Main street: spawn → well → tower
  [
    [0, 11],
    [0, 4],
    [0, -2],
    [0, -8],
    [0, -15],
    [0, -22],
    [0, -26],
  ],
  // West square → cottage
  [
    [0, -8],
    [-4, -8],
    [-8, -8],
  ],
  // East square → archive → barn spur
  [
    [0, -8],
    [4, -8],
    [8, -7.5],
    [12, -5],
    [15, -2],
  ],
  // North cross street: gallery ↔ workshop
  [
    [-12, -17],
    [-6, -17],
    [0, -17],
    [6, -17],
    [12, -17],
  ],
  // Link main street up to cross street
  [
    [0, -15],
    [0, -17],
  ],
]

function Segment({
  a,
  b,
  map,
}: {
  a: Pt
  b: Pt
  map: THREE.CanvasTexture
}) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const length = Math.hypot(dx, dz)
  if (length < 0.01) return null

  const midX = (a[0] + b[0]) / 2
  const midZ = (a[1] + b[1]) / 2
  const angle = Math.atan2(dx, dz)

  // Unique repeat so stones don't stretch
  const segMap = map.clone()
  segMap.repeat.set(PATH_WIDTH * 0.55, length * 0.55)
  segMap.needsUpdate = true

  return (
    <mesh
      position={[midX, Y, midZ]}
      rotation={[-Math.PI / 2, 0, -angle]}
      receiveShadow
    >
      <planeGeometry args={[PATH_WIDTH, length + 0.15]} />
      <meshLambertMaterial map={segMap} />
    </mesh>
  )
}

function Plaza({ map }: { map: THREE.CanvasTexture }) {
  const plazaMap = map.clone()
  plazaMap.repeat.set(3.2, 3.2)
  plazaMap.needsUpdate = true

  return (
    <group>
      <mesh position={[0, Y - 0.005, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.2, 16]} />
        <meshLambertMaterial map={plazaMap} />
        <Edges color={EDGE} threshold={25} />
      </mesh>
      {/* irregular rim stones */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2
        const r = 4.0
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, Y + 0.01, -8 + Math.sin(a) * r]}
            rotation={[-Math.PI / 2, 0, a]}
            receiveShadow
          >
            <planeGeometry args={[0.55 + (i % 3) * 0.1, 0.4]} />
            <meshLambertMaterial color={i % 2 === 0 ? '#6e6a64' : '#585450'} />
            <Edges color={EDGE} threshold={20} />
          </mesh>
        )
      })}
    </group>
  )
}

export function CobblePath() {
  const map = useMemo(() => makeCobbleTexture(), [])

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
