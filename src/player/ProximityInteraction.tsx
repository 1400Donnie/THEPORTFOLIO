import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { projects } from '../data/projects'

/** How close you need to be (XZ) to enter a building. */
export const ENTER_RADIUS = 9

function findProjectId(hits: THREE.Intersection[]): string | null {
  for (const hit of hits) {
    let obj: THREE.Object3D | null = hit.object
    while (obj) {
      if (typeof obj.userData.projectId === 'string') {
        return obj.userData.projectId
      }
      obj = obj.parent
    }
  }
  return null
}

export function ProximityInteraction({
  enabled,
  onNearby,
  onSelect,
}: {
  enabled: boolean
  onNearby: (id: string | null) => void
  onSelect: (id: string) => void
}) {
  const { camera, scene } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(0, 0), [])
  const nearbyRef = useRef<string | null>(null)
  const enabledRef = useRef(enabled)
  const onNearbyRef = useRef(onNearby)
  const onSelectRef = useRef(onSelect)

  enabledRef.current = enabled
  onNearbyRef.current = onNearby
  onSelectRef.current = onSelect

  useFrame(() => {
    if (!enabledRef.current) {
      if (nearbyRef.current !== null) {
        nearbyRef.current = null
        onNearbyRef.current(null)
      }
      return
    }

    // Must be aimed at the building (center reticle raycast)...
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObjects(scene.children, true)
    const aimedId = findProjectId(hits)

    let targetId: string | null = null
    if (aimedId) {
      const project = projects.find((p) => p.id === aimedId)
      if (project) {
        const dx = camera.position.x - project.position[0]
        const dz = camera.position.z - project.position[2]
        const dist = Math.hypot(dx, dz)
        // ...and within radius
        if (dist <= ENTER_RADIUS) {
          targetId = aimedId
        }
      }
    }

    if (targetId !== nearbyRef.current) {
      nearbyRef.current = targetId
      onNearbyRef.current(targetId)
    }
  })

  useEffect(() => {
    const tryEnter = () => {
      if (!enabledRef.current || !nearbyRef.current) return false
      onSelectRef.current(nearbyRef.current)
      return true
    }

    // pointerdown + capture is reliable under pointer lock (click often is not)
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (!enabledRef.current || !nearbyRef.current) return
      const target = e.target as HTMLElement | null
      if (target?.closest?.('.overlay-backdrop, .start-screen, .overlay-panel')) return
      tryEnter()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE' && e.code !== 'Enter') return
      if (tryEnter()) e.preventDefault()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return null
}
