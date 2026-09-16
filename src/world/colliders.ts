import { projects, type Project } from '../data/projects'

export type Collider = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Local footprint half-extents before yaw. */
const FOOTPRINT: Record<Project['kind'], { halfW: number; halfD: number }> = {
  cottage: { halfW: 4.2, halfD: 3.6 },
}

function footprintToWorldAABB(
  x: number,
  z: number,
  yaw: number,
  halfW: number,
  halfD: number,
): Collider {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  const extentX = Math.abs(c) * halfW + Math.abs(s) * halfD
  const extentZ = Math.abs(s) * halfW + Math.abs(c) * halfD
  return {
    minX: x - extentX,
    maxX: x + extentX,
    minZ: z - extentZ,
    maxZ: z + extentZ,
  }
}

let cache: Collider[] | null = null

export function getBuildingColliders(): Collider[] {
  if (cache) return cache
  cache = projects.map((p) => {
    const { halfW, halfD } = FOOTPRINT[p.kind]
    return footprintToWorldAABB(p.position[0], p.position[2], p.rotation, halfW, halfD)
  })
  return cache
}

export function resolveBuildingCollisions(
  x: number,
  z: number,
  radius: number,
): { x: number; z: number } {
  let px = x
  let pz = z

  for (const c of getBuildingColliders()) {
    const minX = c.minX - radius
    const maxX = c.maxX + radius
    const minZ = c.minZ - radius
    const maxZ = c.maxZ + radius

    if (px <= minX || px >= maxX || pz <= minZ || pz >= maxZ) continue

    const left = px - minX
    const right = maxX - px
    const near = pz - minZ
    const far = maxZ - pz
    const smallest = Math.min(left, right, near, far)

    if (smallest === left) px = minX
    else if (smallest === right) px = maxX
    else if (smallest === near) pz = minZ
    else pz = maxZ
  }

  return { x: px, z: pz }
}
