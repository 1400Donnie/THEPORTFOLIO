import { Edges } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'

const SWING_DURATION = 0.28

export function Sword({
  visible,
  canSwing,
  sprintingRef,
}: {
  visible: boolean
  canSwing: boolean
  sprintingRef: MutableRefObject<boolean>
}) {
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const bob = useRef(0)
  const swingT = useRef(0)
  const swinging = useRef(false)
  const canSwingRef = useRef(canSwing)
  canSwingRef.current = canSwing

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (!canSwingRef.current) return
      const target = e.target as HTMLElement | null
      if (target?.closest?.('.overlay-backdrop, .start-screen, .overlay-panel')) return
      // Restart swing if already swinging (Minecraft-like spam)
      swinging.current = true
      swingT.current = 0
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.visible = visible
    if (!visible) {
      swinging.current = false
      swingT.current = 0
      return
    }

    const bobSpeed = sprintingRef.current ? 4.2 : 2.2
    bob.current += delta * bobSpeed
    const bobAmp = sprintingRef.current ? 0.02 : 0.012
    const bobY = Math.sin(bob.current) * bobAmp
    const bobX = Math.cos(bob.current * 0.7) * (bobAmp * 0.65)

    // Rest pose attached to camera
    group.current.position.copy(camera.position)
    group.current.quaternion.copy(camera.quaternion)
    group.current.translateX(0.42 + bobX)
    group.current.translateY(-0.38 + bobY)
    group.current.translateZ(-0.55)
    group.current.rotateX(0.15)
    group.current.rotateY(-0.35)
    group.current.rotateZ(-0.2)

    if (!swinging.current) return

    swingT.current += delta / SWING_DURATION
    if (swingT.current >= 1) {
      swinging.current = false
      swingT.current = 0
      return
    }

    // Smooth 0→1→0 arc — tip chops forward into the world, across the view
    const t = swingT.current
    const arc = Math.sin(t * Math.PI)
    const easeOut = 1 - Math.pow(1 - Math.min(1, t * 1.15), 2)

    // From lower-right toward center and forward (-Z in camera space)
    group.current.translateX(-arc * 0.2)
    group.current.translateY(0.04 - easeOut * 0.28)
    group.current.translateZ(-0.08 - easeOut * 0.35)

    // Negative X pitches the tip forward (into the scene), not back at the camera
    group.current.rotateX(-easeOut * 1.15)
    group.current.rotateZ(-arc * 0.45)
    group.current.rotateY(arc * 0.15)
  })

  return (
    <group ref={group} visible={visible}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.08, 0.85, 0.02]} />
        <meshLambertMaterial color="#b8bcc2" />
        <Edges color="#111" threshold={15} />
      </mesh>
      <mesh position={[0, 0.82, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.07, 0.07, 0.02]} />
        <meshLambertMaterial color="#b8bcc2" />
        <Edges color="#111" threshold={15} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.32, 0.07, 0.06]} />
        <meshLambertMaterial color="#3d2414" />
        <Edges color="#111" threshold={15} />
      </mesh>
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.07, 0.35, 0.07]} />
        <meshLambertMaterial color="#6b4226" />
        <Edges color="#111" threshold={15} />
      </mesh>
      <mesh position={[0, -0.48, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.1]} />
        <meshLambertMaterial color="#3d2414" />
        <Edges color="#111" threshold={15} />
      </mesh>
    </group>
  )
}
