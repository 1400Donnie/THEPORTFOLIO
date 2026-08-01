import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Sword } from './Sword'
import { FENCE } from '../world/Fence'

const SPEED = 8
const EYE_HEIGHT = 1.7
/** Keep the player just inside the fence line. */
const PAD = 1.2
const MIN_X = FENCE.minX + PAD
const MAX_X = FENCE.maxX - PAD
const MIN_Z = FENCE.minZ + PAD
const MAX_Z = FENCE.maxZ - PAD

type Keys = Record<string, boolean>

export function FirstPerson({
  enabled,
  locked,
  onLock,
  onUnlock,
}: {
  enabled: boolean
  locked: boolean
  onLock: () => void
  onUnlock: () => void
}) {
  const controlsRef = useRef<{ lock: () => void; unlock: () => void } | null>(null)
  const keys = useRef<Keys>({})
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 10)
    camera.rotation.set(0, 0, 0)
  }, [camera])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    if (!enabled && controlsRef.current) {
      controlsRef.current.unlock()
    }
  }, [enabled])

  useFrame((_, delta) => {
    if (!locked || !enabled) return

    const k = keys.current
    direction.current.set(0, 0, 0)
    if (k.KeyW || k.ArrowUp) direction.current.z -= 1
    if (k.KeyS || k.ArrowDown) direction.current.z += 1
    if (k.KeyA || k.ArrowLeft) direction.current.x -= 1
    if (k.KeyD || k.ArrowRight) direction.current.x += 1

    if (direction.current.lengthSq() > 0) {
      direction.current.normalize()
    }

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, new THREE.Vector3(0, 1, 0)).normalize()

    velocity.current.set(0, 0, 0)
    velocity.current.addScaledVector(forward.current, -direction.current.z * SPEED)
    velocity.current.addScaledVector(right.current, direction.current.x * SPEED)

    camera.position.x += velocity.current.x * delta
    camera.position.z += velocity.current.z * delta
    camera.position.y = EYE_HEIGHT

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, MIN_X, MAX_X)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, MIN_Z, MAX_Z)
  })

  return (
    <>
      <PointerLockControls
        ref={controlsRef as never}
        enabled={enabled}
        onLock={onLock}
        onUnlock={onUnlock}
      />
      <Sword visible={locked && enabled} />
    </>
  )
}
