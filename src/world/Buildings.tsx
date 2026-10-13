import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Group } from 'three'
import type { Project } from '../data/projects'
import { projects } from '../data/projects'

/**
 * One-story house, sized in meters (1 unit = 1 m).
 * Walls meet at corners without shared volume. Roof underside lands on the
 * eave line, and the gable is a triangle that follows that slope.
 * Windows are opaque. The front faces +Z, toward the path.
 */

const SIDING = '#e4d8c6'
const TRIM = '#f3eee6'
const GLASS = '#1a2633'

const W = 7.4
const D = 5.4
const T = 0.16
const FLOOR = 0.3
const WALL_H = 2.5
const EAVE = FLOOR + WALL_H
const RISE = 1.12
const HALF_D = D / 2
const HALF_W = W / 2
const OH_X = 0.36
const OH_Z = 0.3
const PORCH_D = 1.6
const STEP_D = 0.32
const STEP_W = 1.45
const ROOF_T = 0.1

/** Front of the entry steps, in house-local Z. Collider half-depth uses this. */
export const HOUSE_FRONT_Z = HALF_D + PORCH_D + STEP_D
export const HOUSE_HALF_W = HALF_W + 0.06
export const HOUSE_HALF_D = HOUSE_FRONT_Z

const DOOR_W = 0.96
const DOOR_H = 2.08
const WIN_W = 1.08
const WIN_H = 1.18
const SILL = FLOOR + 0.78
const WIN_CX = 2.05

function makeTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 256,
) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  return texture
}

type Maps = {
  siding: THREE.CanvasTexture
  shingle: THREE.CanvasTexture
  stone: THREE.CanvasTexture
  wood: THREE.CanvasTexture
  door: THREE.CanvasTexture
}

let mapsCache: Maps | null = null

function getMaps(): Maps {
  if (mapsCache) return mapsCache

  const siding = makeTexture((ctx, s) => {
    const rows = 16
    const h = s / rows
    for (let i = 0; i < rows; i++) {
      const y = i * h
      const tone = 214 + ((i * 17) % 18)
      const g = ctx.createLinearGradient(0, y, 0, y + h)
      g.addColorStop(0, `rgb(${tone + 12},${tone + 4},${tone - 12})`)
      g.addColorStop(0.72, `rgb(${tone},${tone - 10},${tone - 26})`)
      g.addColorStop(1, `rgb(${tone - 28},${tone - 34},${tone - 42})`)
      ctx.fillStyle = g
      ctx.fillRect(0, y, s, h)
      ctx.fillStyle = 'rgba(90,70,50,0.28)'
      ctx.fillRect(0, y + h - 1.5, s, 1.5)
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(120,90,60,${0.03 + (i % 5) * 0.012})`
      ctx.fillRect((i * 47) % s, (i * 19) % s, 2, 1)
    }
  })

  const shingle = makeTexture((ctx, s) => {
    ctx.fillStyle = '#3a3532'
    ctx.fillRect(0, 0, s, s)
    const rowH = 18
    const tab = 28
    for (let y = 0; y < s + rowH; y += rowH) {
      const offset = (y / rowH) % 2 === 0 ? 0 : tab / 2
      for (let x = -tab; x < s + tab; x += tab) {
        const n = 48 + ((x * 3 + y * 5) % 22)
        ctx.fillStyle = `rgb(${n + 8},${n + 4},${n})`
        ctx.fillRect(x + offset + 1, y + 1, tab - 2, rowH - 3)
        ctx.fillStyle = 'rgba(20,16,14,0.45)'
        ctx.fillRect(x + offset, y + rowH - 3, tab, 2)
      }
    }
  })

  const stone = makeTexture((ctx, s) => {
    ctx.fillStyle = '#6d6a66'
    ctx.fillRect(0, 0, s, s)
    for (let row = 0, y = 2; y < s; row++) {
      const h = 28 + (row % 3) * 6
      let x = row % 2 === 0 ? 2 : -16
      let i = 0
      while (x < s) {
        const w = 36 + ((row * 5 + i * 7) % 28)
        const n = 96 + ((row * 13 + i * 9) % 36)
        ctx.fillStyle = `rgb(${n},${n - 2},${n - 6})`
        ctx.fillRect(x, y, w - 3, h - 3)
        ctx.strokeStyle = 'rgba(40,36,32,0.55)'
        ctx.strokeRect(x + 0.5, y + 0.5, w - 4, h - 4)
        x += w
        i++
      }
      y += h
    }
  })

  const wood = makeTexture((ctx, s) => {
    ctx.fillStyle = '#8a6240'
    ctx.fillRect(0, 0, s, s)
    for (let y = 0; y < s; y += 22) {
      const n = 118 + ((y * 3) % 30)
      ctx.fillStyle = `rgb(${n + 28},${n - 8},${n - 40})`
      ctx.fillRect(0, y, s, 18)
      ctx.fillStyle = 'rgba(60,36,18,0.35)'
      ctx.fillRect(0, y + 17, s, 3)
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = `rgba(70,42,20,${0.15 + (i % 3) * 0.08})`
        ctx.beginPath()
        ctx.moveTo(0, y + 3 + i * 2)
        ctx.lineTo(s, y + 2 + i * 2)
        ctx.stroke()
      }
    }
  })

  const door = makeTexture((ctx, s) => {
    ctx.fillStyle = '#6b4528'
    ctx.fillRect(0, 0, s, s)
    for (let x = 0; x < s; x += 14) {
      const n = 92 + ((x * 5) % 28)
      ctx.fillStyle = `rgb(${n + 20},${n - 10},${n - 36})`
      ctx.fillRect(x, 0, 12, s)
      ctx.strokeStyle = 'rgba(40,22,10,0.35)'
      ctx.beginPath()
      ctx.moveTo(x + 4, 0)
      ctx.lineTo(x + 6, s)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(40,24,12,0.65)'
    ctx.lineWidth = 6
    ctx.strokeRect(18, 18, s - 36, s * 0.38)
    ctx.strokeRect(18, s * 0.52, s - 36, s * 0.36)
  })

  mapsCache = { siding, shingle, stone, wood, door }
  return mapsCache
}

function clonedMap(map: THREE.Texture, repeat: [number, number]) {
  const next = map.clone()
  next.wrapS = THREE.RepeatWrapping
  next.wrapT = THREE.RepeatWrapping
  next.repeat.set(repeat[0], repeat[1])
  next.needsUpdate = true
  return next
}

function Box({
  args,
  position,
  rotation,
  map,
  color,
  repeat,
  roughness = 0.9,
  metalness = 0.02,
}: {
  args: [number, number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  map?: THREE.Texture
  color?: string
  repeat?: [number, number]
  roughness?: number
  metalness?: number
}) {
  const rx = repeat?.[0] ?? 1
  const ry = repeat?.[1] ?? 1
  const tex = useMemo(() => (map ? clonedMap(map, [rx, ry]) : undefined), [map, rx, ry])
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        map={tex}
        color={color ?? '#ffffff'}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  )
}

/** Panel in the X/Y plane (front and back walls). */
function PanelX({
  x0,
  x1,
  y0,
  y1,
  z,
  map,
}: {
  x0: number
  x1: number
  y0: number
  y1: number
  z: number
  map: THREE.Texture
}) {
  const w = x1 - x0
  const h = y1 - y0
  if (w < 0.02 || h < 0.02) return null
  return (
    <Box
      args={[w, h, T]}
      position={[(x0 + x1) / 2, (y0 + y1) / 2, z]}
      map={map}
      repeat={[Math.max(1, w / 1.1), Math.max(1, h / 0.15)]}
    />
  )
}

/** Panel in the Z/Y plane (side walls). */
function PanelZ({
  z0,
  z1,
  y0,
  y1,
  x,
  map,
}: {
  z0: number
  z1: number
  y0: number
  y1: number
  x: number
  map: THREE.Texture
}) {
  const d = z1 - z0
  const h = y1 - y0
  if (d < 0.02 || h < 0.02) return null
  return (
    <Box
      args={[T, h, d]}
      position={[x, (y0 + y1) / 2, (z0 + z1) / 2]}
      map={map}
      repeat={[Math.max(1, d / 1.1), Math.max(1, h / 0.15)]}
    />
  )
}

/**
 * Underside runs from (z0, y0) to (z1, y1). Thickness grows along the upward normal.
 */
function SlopedSlab({
  width,
  z0,
  y0,
  z1,
  y1,
  map,
  repeat,
}: {
  width: number
  z0: number
  y0: number
  z1: number
  y1: number
  map: THREE.Texture
  repeat: [number, number]
}) {
  const dz = z1 - z0
  const dy = y1 - y0
  const len = Math.hypot(dz, dy)
  const theta = Math.sign(dz || 1) * Math.atan2(-dy, Math.abs(dz))
  const ny = Math.cos(theta)
  const nz = Math.sin(theta)
  return (
    <Box
      args={[width, ROOF_T, len]}
      position={[0, (y0 + y1) / 2 + ny * (ROOF_T / 2), (z0 + z1) / 2 + nz * (ROOF_T / 2)]}
      rotation={[theta, 0, 0]}
      map={map}
      repeat={repeat}
      roughness={0.94}
    />
  )
}

function Gable({ x, sign }: { x: number; sign: 1 | -1 }) {
  const map = useMemo(() => clonedMap(getMaps().siding, [D / 1.1, RISE / 0.15]), [])
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-HALF_D, 0)
    shape.lineTo(HALF_D, 0)
    shape.lineTo(0, RISE)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false })
    geo.translate(0, 0, -T / 2)
    return geo
  }, [])

  return (
    <mesh
      geometry={geometry}
      position={[x, EAVE, 0]}
      rotation={[0, sign * (Math.PI / 2), 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial map={map} color="#ffffff" roughness={0.9} />
    </mesh>
  )
}

/** Opaque pane — reads as glass, does not show the interior. */
function SolidWindow({
  position,
  rotation,
  width,
  height,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  width: number
  height: number
}) {
  return (
    <group position={position} rotation={rotation}>
      <Box args={[width, height, 0.04]} position={[0, 0, 0]} color={GLASS} roughness={0.16} metalness={0.55} />
      <Box args={[0.04, height, 0.025]} position={[0, 0, 0.03]} color={TRIM} roughness={0.6} />
      <Box args={[width, 0.04, 0.025]} position={[0, 0, 0.03]} color={TRIM} roughness={0.6} />
      <Box
        args={[width + 0.14, 0.07, 0.05]}
        position={[0, height / 2 + 0.02, 0.045]}
        color={TRIM}
        roughness={0.6}
      />
      <Box
        args={[width + 0.14, 0.07, 0.05]}
        position={[0, -height / 2 - 0.02, 0.045]}
        color={TRIM}
        roughness={0.6}
      />
      <Box
        args={[0.07, height + 0.14, 0.05]}
        position={[-(width / 2 + 0.02), 0, 0.045]}
        color={TRIM}
        roughness={0.6}
      />
      <Box
        args={[0.07, height + 0.14, 0.05]}
        position={[width / 2 + 0.02, 0, 0.045]}
        color={TRIM}
        roughness={0.6}
      />
      <Box
        args={[width + 0.22, 0.07, 0.1]}
        position={[0, -height / 2 - 0.02, 0.06]}
        color={TRIM}
        roughness={0.55}
      />
    </group>
  )
}

function WoodDoor({ position }: { position: [number, number, number] }) {
  const maps = getMaps()
  return (
    <group position={position}>
      <Box
        args={[DOOR_W, DOOR_H, 0.05]}
        position={[0, 0, 0]}
        map={maps.door}
        repeat={[1, 1]}
        roughness={0.78}
      />
      <Box
        args={[0.08, DOOR_H + 0.1, 0.04]}
        position={[-(DOOR_W / 2 + 0.02), 0, 0.04]}
        color={TRIM}
        roughness={0.55}
      />
      <Box
        args={[0.08, DOOR_H + 0.1, 0.04]}
        position={[DOOR_W / 2 + 0.02, 0, 0.04]}
        color={TRIM}
        roughness={0.55}
      />
      <Box
        args={[DOOR_W + 0.16, 0.08, 0.04]}
        position={[0, DOOR_H / 2 + 0.02, 0.04]}
        color={TRIM}
        roughness={0.55}
      />
      <mesh position={[DOOR_W * 0.34, -0.05, 0.045]} castShadow>
        <sphereGeometry args={[0.035, 14, 14]} />
        <meshStandardMaterial color="#c6a15e" metalness={0.72} roughness={0.32} />
      </mesh>
    </group>
  )
}

function HouseShell() {
  const maps = useMemo(() => getMaps(), [])
  const innerL = -(HALF_W - T)
  const innerR = HALF_W - T
  const sideX = HALF_W - T / 2
  const frontZ = HALF_D - T / 2
  const backZ = -(HALF_D - T / 2)

  const doorL = -DOOR_W / 2
  const doorR = DOOR_W / 2
  const leftWin0 = -WIN_CX - WIN_W / 2
  const leftWin1 = -WIN_CX + WIN_W / 2
  const rightWin0 = WIN_CX - WIN_W / 2
  const rightWin1 = WIN_CX + WIN_W / 2
  const winTop = SILL + WIN_H
  const doorTop = FLOOR + DOOR_H

  const sideWinW = 1.02
  const sideWin0 = -sideWinW / 2
  const sideWin1 = sideWinW / 2

  const yUnder = (z: number) => EAVE + RISE - (RISE / HALF_D) * z
  const eaveZ = HALF_D + OH_Z
  const porchOuterZ = HALF_D + PORCH_D
  const porchRoofDrop = 0.42
  const porchZ0 = eaveZ + 0.03
  const porchHighY = yUnder(eaveZ) - 0.04
  const porchLowY = porchHighY - porchRoofDrop
  const porchRoofY = (z: number) =>
    porchHighY + ((porchLowY - porchHighY) * (z - porchZ0)) / (porchOuterZ - porchZ0)

  const postZ = porchOuterZ - 0.14
  const postTop = porchRoofY(postZ)
  const postXs = [-(HALF_W - 0.32), -0.86, 0.86, HALF_W - 0.32]
  const postH = postTop - FLOOR

  const roofW = W + OH_X * 2
  const shingle: [number, number] = [roofW / 0.55, 8]

  return (
    <group>
      {/* Foundation stops at the front wall; porch deck continues from there. */}
      <Box
        args={[W + 0.16, FLOOR, D + 0.08]}
        position={[0, FLOOR / 2, -0.04]}
        map={maps.stone}
        repeat={[4, 2]}
        roughness={0.96}
      />

      <PanelX x0={innerL} x1={leftWin0} y0={FLOOR} y1={EAVE} z={frontZ} map={maps.siding} />
      <PanelX x0={leftWin0} x1={leftWin1} y0={FLOOR} y1={SILL} z={frontZ} map={maps.siding} />
      <PanelX x0={leftWin0} x1={leftWin1} y0={winTop} y1={EAVE} z={frontZ} map={maps.siding} />
      <PanelX x0={leftWin1} x1={doorL} y0={FLOOR} y1={EAVE} z={frontZ} map={maps.siding} />
      <PanelX x0={doorL} x1={doorR} y0={doorTop} y1={EAVE} z={frontZ} map={maps.siding} />
      <PanelX x0={doorR} x1={rightWin0} y0={FLOOR} y1={EAVE} z={frontZ} map={maps.siding} />
      <PanelX x0={rightWin0} x1={rightWin1} y0={FLOOR} y1={SILL} z={frontZ} map={maps.siding} />
      <PanelX x0={rightWin0} x1={rightWin1} y0={winTop} y1={EAVE} z={frontZ} map={maps.siding} />
      <PanelX x0={rightWin1} x1={innerR} y0={FLOOR} y1={EAVE} z={frontZ} map={maps.siding} />

      <PanelX x0={innerL} x1={innerR} y0={FLOOR} y1={EAVE} z={backZ} map={maps.siding} />

      {([-1, 1] as const).map((sign) => (
        <group key={sign}>
          <PanelZ z0={-HALF_D} z1={sideWin0} y0={FLOOR} y1={EAVE} x={sign * sideX} map={maps.siding} />
          <PanelZ z0={sideWin1} z1={HALF_D} y0={FLOOR} y1={EAVE} x={sign * sideX} map={maps.siding} />
          <PanelZ z0={sideWin0} z1={sideWin1} y0={FLOOR} y1={SILL} x={sign * sideX} map={maps.siding} />
          <PanelZ z0={sideWin0} z1={sideWin1} y0={winTop} y1={EAVE} x={sign * sideX} map={maps.siding} />
          <Gable x={sign * sideX} sign={sign} />
        </group>
      ))}

      <SolidWindow
        position={[-WIN_CX, SILL + WIN_H / 2, HALF_D - 0.02]}
        width={WIN_W}
        height={WIN_H}
      />
      <SolidWindow
        position={[WIN_CX, SILL + WIN_H / 2, HALF_D - 0.02]}
        width={WIN_W}
        height={WIN_H}
      />
      <SolidWindow
        position={[-(HALF_W - 0.02), SILL + WIN_H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={sideWinW}
        height={WIN_H}
      />
      <SolidWindow
        position={[HALF_W - 0.02, SILL + WIN_H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={sideWinW}
        height={WIN_H}
      />

      <WoodDoor position={[0, FLOOR + DOOR_H / 2, HALF_D - 0.02]} />

      {/* Main roof. Slabs cross a few centimeters at the ridge; the cap seals it. */}
      <SlopedSlab
        width={roofW}
        z0={-0.1}
        y0={yUnder(-0.1)}
        z1={eaveZ}
        y1={yUnder(eaveZ)}
        map={maps.shingle}
        repeat={shingle}
      />
      <SlopedSlab
        width={roofW}
        z0={0.1}
        y0={yUnder(-0.1)}
        z1={-(HALF_D + OH_Z)}
        y1={yUnder(HALF_D + OH_Z)}
        map={maps.shingle}
        repeat={shingle}
      />
      <Box
        args={[roofW + 0.06, 0.1, 0.56]}
        position={[0, EAVE + RISE + 0.08, 0]}
        map={maps.shingle}
        repeat={[10, 1]}
        roughness={0.94}
      />

      {/* Porch deck meets the foundation on the front face. */}
      <Box
        args={[W, FLOOR - 0.02, PORCH_D + 0.02]}
        position={[0, (FLOOR + 0.02) / 2, HALF_D + PORCH_D / 2 - 0.01]}
        map={maps.wood}
        repeat={[6, 3]}
        roughness={0.84}
      />
      <Box
        args={[STEP_W, FLOOR / 2, STEP_D]}
        position={[0, FLOOR / 4, porchOuterZ + STEP_D / 2 - 0.01]}
        map={maps.wood}
        repeat={[2, 1]}
        roughness={0.84}
      />

      {postXs.map((x) => (
        <Box
          key={x}
          args={[0.14, postH, 0.14]}
          position={[x, FLOOR + postH / 2, postZ]}
          map={maps.wood}
          repeat={[1, 3]}
          roughness={0.8}
        />
      ))}

      {/* Rails: sides, and front bays on either side of the steps. */}
      <Rail x={-(HALF_W - 0.32)} z0={HALF_D + 0.02} z1={postZ} y={FLOOR} map={maps.wood} axis="z" />
      <Rail x={HALF_W - 0.32} z0={HALF_D + 0.02} z1={postZ} y={FLOOR} map={maps.wood} axis="z" />
      <Rail x0={postXs[0]} x1={postXs[1]} z={postZ} y={FLOOR} map={maps.wood} axis="x" />
      <Rail x0={postXs[2]} x1={postXs[3]} z={postZ} y={FLOOR} map={maps.wood} axis="x" />

      <SlopedSlab
        width={W + 0.2}
        z0={porchZ0}
        y0={porchHighY}
        z1={porchOuterZ + 0.06}
        y1={porchLowY}
        map={maps.shingle}
        repeat={[8, 3]}
      />
      <Box
        args={[W + 0.08, 0.18, 0.08]}
        position={[0, porchHighY + 0.02, eaveZ]}
        color={TRIM}
        roughness={0.55}
      />
    </group>
  )
}

function Rail({
  x = 0,
  z = 0,
  x0 = 0,
  x1 = 0,
  z0 = 0,
  z1 = 0,
  y,
  map,
  axis,
}: {
  x?: number
  z?: number
  x0?: number
  x1?: number
  z0?: number
  z1?: number
  y: number
  map: THREE.Texture
  axis: 'x' | 'z'
}) {
  const along = axis === 'x' ? x1 - x0 : z1 - z0
  const midX = axis === 'x' ? (x0 + x1) / 2 : x
  const midZ = axis === 'z' ? (z0 + z1) / 2 : z
  const args: [number, number, number] =
    axis === 'x' ? [Math.abs(along), 0.08, 0.06] : [0.06, 0.08, Math.abs(along)]
  return (
    <group>
      <Box args={args} position={[midX, y + 0.92, midZ]} map={map} roughness={0.8} />
      <Box args={args} position={[midX, y + 0.42, midZ]} map={map} roughness={0.8} />
    </group>
  )
}

function Building({ project }: { project: Project }) {
  const root = useRef<Group>(null)

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
      <HouseShell />
      <mesh position={[0, 2.2, PORCH_D / 2]}>
        <boxGeometry args={[W + 1.2, 6.5, D + PORCH_D + STEP_D + 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function Buildings() {
  return (
    <group>
      {projects.map((project) => (
        <Building key={project.id} project={project} />
      ))}
    </group>
  )
}
