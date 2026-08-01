import { Edges } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export function Sword({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const bob = useRef(0)

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.visible = visible
    if (!visible) return

    bob.current += delta * 2.2
    const bobY = Math.sin(bob.current) * 0.012
    const bobX = Math.cos(bob.current * 0.7) * 0.008

    group.current.position.copy(camera.position)
    group.current.quaternion.copy(camera.quaternion)
    group.current.translateX(0.42 + bobX)
    group.current.translateY(-0.38 + bobY)
    group.current.translateZ(-0.55)
    group.current.rotateX(0.15)
    group.current.rotateY(-0.35)
    group.current.rotateZ(-0.2)
  })

  return (
    <group ref={group} visible={visible}>
      {/* blade */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.08, 0.85, 0.02]} />
        <meshLambertMaterial color="#b8bcc2" />
        <Edges color="#111" threshold={15} />
      </mesh>
      {/* tip taper suggestion */}
      <mesh position={[0, 0.82, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.07, 0.07, 0.02]} />
        <meshLambertMaterial color="#b8bcc2" />
        <Edges color="#111" threshold={15} />
      </mesh>
      {/* crossguard */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.32, 0.07, 0.06]} />
        <meshLambertMaterial color="#3d2414" />
        <Edges color="#111" threshold={15} />
      </mesh>
      {/* handle */}
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.07, 0.35, 0.07]} />
        <meshLambertMaterial color="#6b4226" />
        <Edges color="#111" threshold={15} />
      </mesh>
      {/* pommel */}
      <mesh position={[0, -0.48, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.1]} />
        <meshLambertMaterial color="#3d2414" />
        <Edges color="#111" threshold={15} />
      </mesh>
    </group>
  )
}
