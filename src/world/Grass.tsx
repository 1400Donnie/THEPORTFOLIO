import { useMemo } from 'react'
import * as THREE from 'three'

function makeGrassTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#4cae3a'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const len = 4 + Math.random() * 14
    const angle = -0.4 + Math.random() * 0.8
    ctx.strokeStyle = Math.random() > 0.5 ? '#2f7a28' : '#3a9230'
    ctx.lineWidth = 1 + Math.random() * 1.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len)
    ctx.stroke()
  }

  for (let i = 0; i < 80; i++) {
    ctx.strokeStyle = 'rgba(20, 40, 10, 0.35)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    const x = Math.random() * size
    const y = Math.random() * size
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(
      x + (Math.random() - 0.5) * 40,
      y + (Math.random() - 0.5) * 40,
      x + (Math.random() - 0.5) * 60,
      y + (Math.random() - 0.5) * 60,
    )
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(18, 18)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function Grass() {
  const texture = useMemo(() => makeGrassTexture(), [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[120, 120]} />
      <meshLambertMaterial map={texture} />
    </mesh>
  )
}
