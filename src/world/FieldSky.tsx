import { Sky, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const CLOUD_TEX =
  'https://rawcdn.githack.com/pmndrs/drei-assets/9225a9f1fbd449d9411125c2f419b843d0308c9f/cloud.png'

type Card = {
  pos: [number, number, number]
  rot: [number, number, number]
  scale: [number, number, number]
  opacity: number
}

type Blob = {
  pos: [number, number, number]
  r: number
  opacity: number
}

type CloudSpec = {
  position: [number, number, number]
  color: string
  shade: string
  cards: Card[]
  blobs: Blob[]
}

function rng(seed: number) {
  let s = seed * 9973 + 11
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function makeCloudParts(seed: number, spread: number) {
  const rand = rng(seed)
  const cards: Card[] = []
  const blobs: Blob[] = []

  // Dense soft mass core — reads as volume from every angle
  const blobCount = 10 + Math.floor(rand() * 6)
  for (let i = 0; i < blobCount; i++) {
    blobs.push({
      pos: [
        (rand() - 0.5) * spread * 1.6,
        (rand() - 0.5) * spread * 0.55,
        (rand() - 0.5) * spread * 1.1,
      ],
      r: 5 + rand() * 9,
      opacity: 0.18 + rand() * 0.2,
    })
  }

  // Many overlapping textured slices at mixed orientations → fluffy, not paper-flat
  const cardCount = 22 + Math.floor(rand() * 10)
  for (let i = 0; i < cardCount; i++) {
    const kind = rand()
    let rot: [number, number, number]
    if (kind < 0.4) {
      // canopy / top
      rot = [-Math.PI / 2 + (rand() - 0.5) * 0.5, rand() * Math.PI * 2, (rand() - 0.5) * 0.4]
    } else if (kind < 0.7) {
      // upright flank
      rot = [(rand() - 0.5) * 0.4, rand() * Math.PI * 2, (rand() - 0.5) * 0.35]
    } else {
      // diagonal cross-section for thickness
      rot = [
        -Math.PI / 3 + (rand() - 0.5) * 0.6,
        rand() * Math.PI * 2,
        Math.PI / 5 + (rand() - 0.5) * 0.5,
      ]
    }

    const w = 10 + rand() * 16
    const h = 7 + rand() * 12
    cards.push({
      pos: [
        (rand() - 0.5) * spread * 1.8,
        (rand() - 0.5) * spread * 0.65,
        (rand() - 0.5) * spread * 1.2,
      ],
      rot,
      scale: [w, h, 1],
      opacity: 0.5 + rand() * 0.4,
    })
  }

  return { cards, blobs }
}

function FixedCloud({
  position,
  color,
  shade,
  cards,
  blobs,
  map,
}: CloudSpec & { map: THREE.Texture }) {
  return (
    <group position={position}>
      {blobs.map((blob, i) => (
        <mesh key={`b-${i}`} position={blob.pos} renderOrder={-6} frustumCulled={false}>
          <sphereGeometry args={[blob.r, 16, 12]} />
          <meshBasicMaterial
            color={shade}
            transparent
            opacity={blob.opacity}
            depthWrite={false}
            toneMapped
            fog={false}
          />
        </mesh>
      ))}
      {cards.map((card, i) => (
        <mesh
          key={`c-${i}`}
          position={card.pos}
          rotation={card.rot}
          scale={card.scale}
          renderOrder={-5}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={map}
            color={color}
            transparent
            opacity={card.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}

const CLOUD_LAYOUT: {
  position: [number, number, number]
  color: string
  shade: string
  seed: number
  spread: number
}[] = [
  { position: [-50, 46, -75], color: '#f2f7fb', shade: '#d5e3ef', seed: 1, spread: 14 },
  { position: [60, 50, -48], color: '#f6fafc', shade: '#d8e6f2', seed: 2, spread: 13 },
  { position: [5, 44, 68], color: '#eef5fa', shade: '#d0e0ec', seed: 3, spread: 15 },
  { position: [-68, 48, 32], color: '#f4f8fc', shade: '#d6e4f0', seed: 4, spread: 12 },
  { position: [78, 52, 55], color: '#f0f6fa', shade: '#d2e2ee', seed: 5, spread: 12 },
  { position: [-18, 42, -22], color: '#f8fbfd', shade: '#dce8f4', seed: 6, spread: 11 },
  { position: [38, 56, -95], color: '#f2f7fb', shade: '#d4e2ee', seed: 7, spread: 13 },
  { position: [-88, 44, -18], color: '#eaf2f8', shade: '#cddceb', seed: 8, spread: 11 },
  { position: [22, 48, 92], color: '#f0f6fa', shade: '#d2e0ee', seed: 9, spread: 14 },
  { position: [-38, 52, 88], color: '#eef5fb', shade: '#d0e0ec', seed: 10, spread: 12 },
  { position: [95, 50, -15], color: '#f4f8fc', shade: '#d8e6f2', seed: 11, spread: 12 },
  { position: [-5, 54, -110], color: '#f2f7fb', shade: '#d5e3ef', seed: 12, spread: 14 },
]

export function FieldSky() {
  const skyFollow = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const map = useTexture(CLOUD_TEX)

  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.needsUpdate = true
  }, [map])

  const clouds = useMemo(
    () =>
      CLOUD_LAYOUT.map((spec) => {
        const parts = makeCloudParts(spec.seed, spec.spread)
        return {
          position: spec.position,
          color: spec.color,
          shade: spec.shade,
          cards: parts.cards,
          blobs: parts.blobs,
        }
      }),
    [],
  )

  useFrame(() => {
    if (skyFollow.current) {
      skyFollow.current.position.copy(camera.position)
    }
  })

  return (
    <>
      <group ref={skyFollow}>
        <Sky
          distance={450}
          sunPosition={[90, 28, 20]}
          inclination={0.48}
          azimuth={0.22}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
          rayleigh={0.55}
          turbidity={6}
        />
      </group>

      {clouds.map((cloud) => (
        <FixedCloud key={cloud.position.join(',')} {...cloud} map={map} />
      ))}
    </>
  )
}
