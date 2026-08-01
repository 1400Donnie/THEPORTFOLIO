import { Edges } from '@react-three/drei'
import { useMemo } from 'react'

const POST_COLOR = '#6b4226'
const RAIL_COLOR = '#8a5a32'

/** Property rectangle — buildings + spawn sit inside this. */
export const FENCE = {
  minX: -22,
  maxX: 22,
  minZ: -28,
  maxZ: 14,
  spacing: 2.4,
} as const

function Post({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.22, 1.4, 0.22]} />
      <meshLambertMaterial color={POST_COLOR} />
      <Edges color="#1a120c" threshold={15} />
    </mesh>
  )
}

function Rail({
  position,
  rotation = 0,
  length,
}: {
  position: [number, number, number]
  rotation?: number
  length: number
}) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[length, 0.12, 0.1]} />
      <meshLambertMaterial color={RAIL_COLOR} />
      <Edges color="#1a120c" threshold={15} />
    </mesh>
  )
}

function buildPerimeter() {
  const { minX, maxX, minZ, maxZ, spacing } = FENCE
  const posts: [number, number, number][] = []
  const rails: { position: [number, number, number]; rotation: number; length: number }[] = []
  const postKey = new Set<string>()

  const addPost = (x: number, z: number) => {
    const key = `${x.toFixed(2)},${z.toFixed(2)}`
    if (postKey.has(key)) return
    postKey.add(key)
    posts.push([x, 0.7, z])
  }

  const addRails = (
    ax: number,
    az: number,
    bx: number,
    bz: number,
    rotation: number,
  ) => {
    const midX = (ax + bx) / 2
    const midZ = (az + bz) / 2
    const length = Math.hypot(bx - ax, bz - az)
    rails.push({ position: [midX, 1.05, midZ], rotation, length })
    rails.push({ position: [midX, 0.55, midZ], rotation, length })
  }

  // North edge (far, -Z) and south edge (near, +Z) — along X
  for (let x = minX; x <= maxX + 0.001; x += spacing) {
    const clampedX = Math.min(x, maxX)
    addPost(clampedX, minZ)
    addPost(clampedX, maxZ)
  }
  for (let x = minX; x < maxX; x += spacing) {
    const next = Math.min(x + spacing, maxX)
    addRails(x, minZ, next, minZ, 0)
    addRails(x, maxZ, next, maxZ, 0)
  }

  // West (-X) and east (+X) — along Z (skip corners already added)
  for (let z = minZ + spacing; z < maxZ; z += spacing) {
    addPost(minX, z)
    addPost(maxX, z)
  }
  for (let z = minZ; z < maxZ; z += spacing) {
    const next = Math.min(z + spacing, maxZ)
    addRails(minX, z, minX, next, Math.PI / 2)
    addRails(maxX, z, maxX, next, Math.PI / 2)
  }

  return { posts, rails }
}

export function Fence() {
  const { posts, rails } = useMemo(() => buildPerimeter(), [])

  return (
    <group>
      {posts.map((p, i) => (
        <Post key={`p-${i}`} position={p} />
      ))}
      {rails.map((r, i) => (
        <Rail key={`r-${i}`} {...r} />
      ))}
    </group>
  )
}
