import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Sword } from './Sword'
import { FENCE } from '../world/Fence'

const WALK_SPEED = 8
const SPRINT_SPEED = 14
const EYE_HEIGHT = 1.7
const JUMP_VELOCITY = 7.2
const GRAVITY = 22
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
  canSwing,
  onLock,
  onUnlock,
}: {
  enabled: boolean
  locked: boolean
  canSwing: boolean
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
  const verticalVel = useRef(0)
  const onGround = useRef(true)
  const sprinting = useRef(false)

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 10)
    camera.rotation.set(0, 0, 0)
    verticalVel.current = 0
    onGround.current = true
  }, [camera])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
      }
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
    if (!locked || !enabled) {
      sprinting.current = false
      return
    }

    const k = keys.current
    const isSprint = Boolean(k.ShiftLeft || k.ShiftRight)
    sprinting.current = isSprint
    const speed = isSprint ? SPRINT_SPEED : WALK_SPEED

    direction.current.set(0, 0, 0)
    if (k.KeyW || k.ArrowUp) direction.current.z -= 1
    if (k.KeyS || k.ArrowDown) direction.current.z += 1
    if (k.KeyA || k.ArrowLeft) direction.current.x -= 1
    if (k.KeyD || k.ArrowRight) direction.current.x += 1

    if (direction.current.lengthSq() > 0) {
      direction.current.normalize()
    }

    if (k.Space && onGround.current) {
      verticalVel.current = JUMP_VELOCITY
      onGround.current = false
      k.Space = false // require a fresh press for the next jump
    }

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, new THREE.Vector3(0, 1, 0)).normalize()

    velocity.current.set(0, 0, 0)
    velocity.current.addScaledVector(forward.current, -direction.current.z * speed)
    velocity.current.addScaledVector(right.current, direction.current.x * speed)

    camera.position.x += velocity.current.x * delta
    camera.position.z += velocity.current.z * delta

    verticalVel.current -= GRAVITY * delta
    camera.position.y += verticalVel.current * delta
    if (camera.position.y <= EYE_HEIGHT) {
      camera.position.y = EYE_HEIGHT
      verticalVel.current = 0
      onGround.current = true
    }

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
      <Sword
        visible={locked && enabled}
        canSwing={canSwing && locked && enabled}
        sprintingRef={sprinting}
      />
    </>
  )
}
