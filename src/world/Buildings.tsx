import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Group } from 'three'
import type { Project } from '../data/projects'
import { projects } from '../data/projects'

/**
 * Signature house: "Field Folio Keep"
 * Fantasy cottage language, slate-teal roof, hall + side annex.
 * Door/windows sit in cut openings (no z-fight) with view-stable materials.
 */

const PLASTER = '#c9b498'
const GLOW = '#f0c45a'
const COPPER = '#8a5a32'

function makeTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 128,
  repeat: [number, number] = [1, 1],
) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat[0], repeat[1])
  texture.anisotropy = 4
  return texture
}

type Maps = {
  plaster: THREE.CanvasTexture
  timber: THREE.CanvasTexture
  stone: THREE.CanvasTexture
  tile: THREE.CanvasTexture
}

let mapsCache: Maps | null = null

function getMaps(): Maps {
  if (mapsCache) return mapsCache

  const plaster = makeTexture((ctx, size) => {
    ctx.fillStyle = '#cbb79a'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 700; i++) {
      const shade = 170 + ((i * 29) % 35)
      ctx.fillStyle = `rgb(${shade},${shade - 18},${shade - 40})`
      ctx.fillRect((i * 17) % size, (i * 41) % size, 1 + (i % 3), 1 + (i % 2))
    }
  }, 128, [2, 2])

  const timber = makeTexture((ctx, size) => {
    ctx.fillStyle = '#3a2416'
    ctx.fillRect(0, 0, size, size)
    for (let x = 0; x < size; x += 6) {
      ctx.fillStyle = x % 12 === 0 ? '#2a1810' : '#4a3020'
      ctx.fillRect(x, 0, 4, size)
    }
  }, 64, [1, 1])

  const stone = makeTexture((ctx, size) => {
    ctx.fillStyle = '#6a727c'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 55; i++) {
      const x = (i * 37) % size
      const y = (i * 23) % size
      const w = 12 + (i % 14)
      const h = 8 + (i % 10)
      const tone = 110 + (i % 40)
      ctx.fillStyle = `rgb(${tone},${tone + 4},${tone + 10})`
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = 'rgba(30,34,40,0.4)'
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
    }
  }, 128, [2, 2])

  const tile = makeTexture((ctx, size) => {
    ctx.fillStyle = '#2f5558'
    ctx.fillRect(0, 0, size, size)
    const rowH = 9
    const tileW = 12
    for (let y = 0; y < size; y += rowH) {
      const offset = (y / rowH) % 2 === 0 ? 0 : tileW / 2
      for (let x = -tileW; x < size + tileW; x += tileW) {
        const g = 70 + ((x * 3 + y * 5) % 35)
        ctx.fillStyle = `rgb(${40 + (g % 15)},${g},${75 + (g % 20)})`
        ctx.fillRect(x + offset + 1, y + 1, tileW - 2, rowH - 2)
      }
    }
  }, 128, [3, 2.5])

  mapsCache = { plaster, timber, stone, tile }
  return mapsCache
}

function Box({
  args,
  position,
  rotation,
  map,
  color,
}: {
  args: [number, number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
  map?: THREE.Texture
  color?: string
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial map={map} color={color ?? '#ffffff'} roughness={0.92} metalness={0.02} />
    </mesh>
  )
}

function SolidRoof({
  width,
  depth,
  wallTop,
  overhang = 0.4,
}: {
  width: number
  depth: number
  wallTop: number
  overhang?: number
}) {
  const maps = getMaps()
  const roofW = width + overhang * 2
  const pitch = 0.58
  const slabDepth = depth * 0.58 + overhang
  const ridgeLift = Math.sin(pitch) * (slabDepth * 0.42)
  const y = wallTop + 0.08
  // Gable fill must stop under the ridge — not poke through the roof
  const gableH = ridgeLift + 0.15
  const ridgeY = y + ridgeLift + 0.12

  return (
    <group>
      <Box
        args={[roofW, 0.28, slabDepth]}
        position={[0, y + ridgeLift * 0.35, slabDepth * 0.32]}
        rotation={[pitch, 0, 0]}
        map={maps.tile}
      />
      <Box
        args={[roofW, 0.28, slabDepth]}
        position={[0, y + ridgeLift * 0.35, -slabDepth * 0.32]}
        rotation={[-pitch, 0, 0]}
        map={maps.tile}
      />
      <Box args={[roofW * 1.02, 0.2, 0.26]} position={[0, ridgeY, 0]} map={maps.timber} />
      {/* Short gable plugs — tucked under the roof slope */}
      <Box
        args={[0.14, gableH, depth * 0.72]}
        position={[-width * 0.5 + 0.07, wallTop + gableH * 0.5, 0]}
        color={PLASTER}
      />
      <Box
        args={[0.14, gableH, depth * 0.72]}
        position={[width * 0.5 - 0.07, wallTop + gableH * 0.5, 0]}
        color={PLASTER}
      />
      <Box
        args={[0.32, 0.24, 0.7]}
        position={[-width * 0.5 - 0.12, wallTop + gableH * 0.55, 0]}
        map={maps.timber}
      />
      <Box
        args={[0.32, 0.24, 0.7]}
        position={[width * 0.5 + 0.12, wallTop + gableH * 0.55, 0]}
        map={maps.timber}
      />
    </group>
  )
}

/** Window seated in a real wall opening — MeshBasic pane so color never shifts with view. */
function GlowWindow({
  position,
  rotation,
  size = [0.55, 0.7],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  size?: [number, number]
}) {
  const maps = getMaps()
  const [w, h] = size
  return (
    <group position={position} rotation={rotation}>
      <Box args={[w + 0.18, h + 0.18, 0.12]} position={[0, 0, 0]} map={maps.timber} />
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[w, h, 0.04]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
      <Box args={[0.04, h * 0.9, 0.03]} position={[0, 0, 0.04]} color="#5a3420" />
      <Box args={[w * 0.9, 0.04, 0.03]} position={[0, 0, 0.04]} color="#5a3420" />
    </group>
  )
}

/** Door seated in a real wall opening. */
function ArchedDoor({ position }: { position: [number, number, number] }) {
  const maps = getMaps()
  return (
    <group position={position}>
      <Box args={[1.45, 2.25, 0.22]} position={[0, 0.05, 0]} map={maps.stone} />
      <Box args={[1.05, 1.9, 0.1]} position={[0, 0, 0.04]} map={maps.timber} />
      <mesh position={[0, 0.88, 0.04]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.52, 0.1, 12, 1, false, 0, Math.PI]} />
        <meshStandardMaterial map={maps.timber} roughness={0.9} />
      </mesh>
      <Box args={[0.04, 1.5, 0.03]} position={[-0.22, -0.08, 0.1]} color="#2a1810" />
      <Box args={[0.04, 1.5, 0.03]} position={[0.22, -0.08, 0.1]} color="#2a1810" />
      <mesh position={[0.36, 0.05, 0.12]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color={COPPER} roughness={0.4} metalness={0.55} />
      </mesh>
      <Box args={[1.6, 0.16, 0.6]} position={[0, -1.12, 0.28]} map={maps.stone} />
      <Box args={[1.3, 0.12, 0.45]} position={[0, -1.0, 0.45]} map={maps.stone} />
    </group>
  )
}

function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box args={[0.08, 0.4, 0.08]} position={[0, 0.15, 0]} color="#1c1c1c" />
      <Box args={[0.24, 0.3, 0.24]} position={[0, -0.08, 0]} color="#222" />
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.16, 0.22, 0.16]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Barrel({ position }: { position: [number, number, number] }) {
  const maps = getMaps()
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.35, 0.38, 0.7, 12]} />
        <meshStandardMaterial map={maps.timber} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.36, 0.03, 6, 16]} />
        <meshStandardMaterial color="#5a6068" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <torusGeometry args={[0.37, 0.03, 6, 16]} />
        <meshStandardMaterial color="#5a6068" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  )
}

function LogPile({ position }: { position: [number, number, number] }) {
  const maps = getMaps()
  return (
    <group position={position}>
      <Box args={[0.9, 0.28, 0.28]} position={[0, 0.14, 0]} rotation={[0, 0.2, 0]} map={maps.timber} />
      <Box args={[0.85, 0.28, 0.28]} position={[0.05, 0.14, 0.28]} rotation={[0, -0.15, 0]} map={maps.timber} />
      <Box args={[0.8, 0.28, 0.28]} position={[0, 0.4, 0.12]} rotation={[0, 0.05, 0]} map={maps.timber} />
    </group>
  )
}

function MossTuft({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.28, 10, 8]} />
      <meshStandardMaterial color="#3f8f35" roughness={1} />
    </mesh>
  )
}

/**
 * Front facade built as panels around openings so door/windows never share
 * a surface with the wall (eliminates z-fight flicker).
 */
function FrontFacadeWithOpenings({
  width,
  height,
  z,
  yBase,
  map,
}: {
  width: number
  height: number
  z: number
  yBase: number
  map: THREE.Texture
}) {
  const T = 0.28
  // Opening layout (local X / Y relative to facade center-bottom)
  const doorW = 1.55
  const doorH = 2.35
  const doorX = 0.15
  const winW = 0.72
  const winH = 0.9
  const winY = 2.15
  const leftWinX = -1.35
  const rightWinX = 1.45

  const left = -width / 2
  const right = width / 2
  const top = yBase + height
  const doorLeft = doorX - doorW / 2
  const doorRight = doorX + doorW / 2
  const doorTop = yBase + doorH

  return (
    <group>
      {/* Left of door (ground to mid) */}
      <Box
        args={[doorLeft - left, doorH, T]}
        position={[(left + doorLeft) / 2, yBase + doorH / 2, z]}
        map={map}
      />
      {/* Right of door (ground to mid) */}
      <Box
        args={[right - doorRight, doorH, T]}
        position={[(doorRight + right) / 2, yBase + doorH / 2, z]}
        map={map}
      />
      {/* Band above door, below window row */}
      <Box
        args={[doorW, Math.max(0.15, winY - winH / 2 - doorTop), T]}
        position={[doorX, (doorTop + (winY - winH / 2)) / 2, z]}
        map={map}
      />
      {/* Window row: left panel, between windows via door gap already, right — with window holes */}
      {/* Far left of left window */}
      <Box
        args={[leftWinX - winW / 2 - left, winH, T]}
        position={[(left + (leftWinX - winW / 2)) / 2, winY, z]}
        map={map}
      />
      {/* Between left window and door column / right window */}
      <Box
        args={[rightWinX - winW / 2 - (leftWinX + winW / 2), winH, T]}
        position={[(leftWinX + winW / 2 + rightWinX - winW / 2) / 2, winY, z]}
        map={map}
      />
      {/* Far right of right window */}
      <Box
        args={[right - (rightWinX + winW / 2), winH, T]}
        position={[((rightWinX + winW / 2) + right) / 2, winY, z]}
        map={map}
      />
      {/* Cap above windows to roof */}
      <Box
        args={[width, Math.max(0.2, top - (winY + winH / 2)), T]}
        position={[0, (winY + winH / 2 + top) / 2, z]}
        map={map}
      />

      {/* Fillings that sit in openings */}
      <ArchedDoor position={[doorX, yBase + doorH / 2 - 0.05, z]} />
      <GlowWindow position={[leftWinX, winY, z]} size={[0.5, 0.7]} />
      <GlowWindow position={[rightWinX, winY, z]} size={[0.5, 0.7]} />
    </group>
  )
}

function FolioCottage() {
  const maps = useMemo(() => getMaps(), [])

  const MW = 4.2
  const MD = 3.8
  const MH = 3.4
  const AW = 3.2
  const AD = 3.0
  const AH = 2.7
  const y0 = 0.2
  const WT = 0.28

  const annexX = MW * 0.55 + AW * 0.5
  const annexZ = 0.35

  return (
    <group>
      <Box args={[8.2, 0.25, 6.4]} position={[0.4, 0.1, 0.1]} map={maps.stone} />
      <mesh position={[0.4, 0.02, 0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.6, 6.8]} />
        <meshStandardMaterial color="#3f8a38" roughness={1} />
      </mesh>

      {/* Shell walls — no single solid block through openings */}
      <Box args={[MW, 0.22, MD]} position={[0, y0, 0]} map={maps.plaster} />
      <Box args={[MW, 0.22, MD]} position={[0, y0 + MH, 0]} map={maps.plaster} />
      <Box args={[MW, MH, WT]} position={[0, y0 + MH / 2, -MD / 2 + WT / 2]} map={maps.plaster} />
      {/* Left wall with window opening */}
      <Box
        args={[WT, 2.05, MD]}
        position={[-MW / 2 + WT / 2, y0 + 1.025, 0]}
        map={maps.plaster}
      />
      <Box
        args={[WT, 0.75, (MD - 0.7) / 2]}
        position={[-MW / 2 + WT / 2, y0 + 2.4, -MD / 4 - 0.175]}
        map={maps.plaster}
      />
      <Box
        args={[WT, 0.75, (MD - 0.7) / 2]}
        position={[-MW / 2 + WT / 2, y0 + 2.4, MD / 4 + 0.175]}
        map={maps.plaster}
      />
      <Box
        args={[WT, Math.max(0.2, MH - 2.8), MD]}
        position={[-MW / 2 + WT / 2, y0 + 2.8 + (MH - 2.8) / 2, 0]}
        map={maps.plaster}
      />
      <Box args={[WT, MH, MD]} position={[MW / 2 - WT / 2, y0 + MH / 2, 0]} map={maps.plaster} />

      <FrontFacadeWithOpenings
        width={MW}
        height={MH}
        z={MD / 2 - WT / 2}
        yBase={y0}
        map={maps.plaster}
      />

      {/* Timber bands (slightly proud, no opening overlap) */}
      <Box args={[MW + 0.06, 0.18, MD - 0.2]} position={[0, 1.15, -0.05]} map={maps.timber} />
      <Box args={[0.18, MH - 0.3, MD - 0.2]} position={[-MW * 0.46, y0 + MH / 2, -0.05]} map={maps.timber} />
      <Box args={[0.18, MH - 0.3, MD - 0.2]} position={[MW * 0.46, y0 + MH / 2, -0.05]} map={maps.timber} />

      <Box args={[0.5, MH * 0.95, 0.5]} position={[-MW * 0.5, y0 + MH * 0.45, MD * 0.5]} map={maps.stone} />
      <Box args={[0.5, MH * 0.95, 0.5]} position={[MW * 0.5, y0 + MH * 0.45, MD * 0.5]} map={maps.stone} />
      <Box args={[0.5, MH * 0.95, 0.5]} position={[-MW * 0.5, y0 + MH * 0.45, -MD * 0.5]} map={maps.stone} />
      <Box args={[0.5, MH * 0.95, 0.5]} position={[MW * 0.5, y0 + MH * 0.45, -MD * 0.5]} map={maps.stone} />

      <SolidRoof width={MW} depth={MD} wallTop={y0 + MH - 0.05} />

      {/* Annex shell + front opening for one window */}
      <Box args={[AW, 0.2, AD]} position={[annexX, y0, annexZ]} map={maps.plaster} />
      <Box args={[AW, 0.2, AD]} position={[annexX, y0 + AH, annexZ]} map={maps.plaster} />
      <Box args={[AW, AH, WT]} position={[annexX, y0 + AH / 2, annexZ - AD / 2 + WT / 2]} map={maps.plaster} />
      <Box args={[WT, AH, AD]} position={[annexX + AW / 2 - WT / 2, y0 + AH / 2, annexZ]} map={maps.plaster} />
      {/* Annex front panels around window */}
      <Box
        args={[AW, 1.35, WT]}
        position={[annexX, y0 + 0.675, annexZ + AD / 2 - WT / 2]}
        map={maps.plaster}
      />
      <Box
        args={[(AW - 0.9) / 2, 0.95, WT]}
        position={[annexX - (AW + 0.9) / 4, y0 + 1.75, annexZ + AD / 2 - WT / 2]}
        map={maps.plaster}
      />
      <Box
        args={[(AW - 0.9) / 2, 0.95, WT]}
        position={[annexX + (AW + 0.9) / 4, y0 + 1.75, annexZ + AD / 2 - WT / 2]}
        map={maps.plaster}
      />
      <Box
        args={[AW, Math.max(0.2, AH - 2.2), WT]}
        position={[annexX, y0 + 2.2 + (AH - 2.2) / 2, annexZ + AD / 2 - WT / 2]}
        map={maps.plaster}
      />
      <GlowWindow position={[annexX, y0 + 1.75, annexZ + AD / 2 - WT / 2]} size={[0.7, 0.75]} />

      <Box args={[AW + 0.04, 0.18, AD - 0.15]} position={[annexX, 1.05, annexZ - 0.05]} map={maps.timber} />
      <Box args={[0.5, AH * 0.9, 0.5]} position={[annexX + AW / 2, y0 + AH * 0.4, annexZ + AD * 0.5]} map={maps.stone} />
      <Box args={[0.5, AH * 0.9, 0.5]} position={[annexX + AW / 2, y0 + AH * 0.4, annexZ - AD * 0.5]} map={maps.stone} />

      <group position={[annexX, 0, annexZ]}>
        <SolidRoof width={AW} depth={AD} wallTop={y0 + AH - 0.05} overhang={0.32} />
      </group>

      <Box args={[0.85, 1.8, 0.85]} position={[annexX - 0.3, AH + 1.35, annexZ - 0.5]} map={maps.stone} />
      <Box args={[1.0, 0.2, 1.0]} position={[annexX - 0.3, AH + 2.2, annexZ - 0.5]} map={maps.stone} />

      {/* Side window opening on main left wall */}
      <GlowWindow
        position={[-MW / 2 + WT / 2, y0 + 2.4, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[0.45, 0.55]}
      />

      <Lantern position={[1.05, 2.55, MD / 2 + 0.1]} />
      <Barrel position={[2.35, 0.5, MD / 2 + 0.55]} />
      <LogPile position={[-2.1, 0.25, MD / 2 + 0.4]} />
      <MossTuft position={[-2.5, 0.35, 1.8]} />
      <MossTuft position={[3.8, 0.32, 1.6]} />
      <MossTuft position={[4.2, 0.3, -0.8]} />
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
      <FolioCottage />
      <mesh position={[1.2, 2.4, 0]}>
        <boxGeometry args={[8.5, 7, 7]} />
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
