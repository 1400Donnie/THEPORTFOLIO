import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { getProject } from './data/projects'
import { FirstPerson } from './player/FirstPerson'
import { ProximityInteraction } from './player/ProximityInteraction'
import { Scene } from './world/Scene'
import { Buildings } from './world/Buildings'
import { ProjectOverlay } from './ui/ProjectOverlay'
import { HelpOverlay } from './ui/HelpOverlay'
import './App.css'

export default function App() {
  const [started, setStarted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nearbyId, setNearbyId] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const helpOpenRef = useRef(false)
  const suppressHelpOnUnlock = useRef(false)
  const wasPointerLocked = useRef(false)

  helpOpenRef.current = helpOpen

  const selected = selectedId ? getProject(selectedId) : null
  const nearby = nearbyId ? getProject(nearbyId) : null
  const blocked = helpOpen || Boolean(selected)

  const exitPointerLockQuietly = useCallback(() => {
    suppressHelpOnUnlock.current = true
    document.exitPointerLock?.()
  }, [])

  const openHelp = useCallback(() => {
    setSelectedId(null)
    setNearbyId(null)
    setHelpOpen(true)
  }, [])

  const handleSelect = useCallback(
    (id: string) => {
      setHelpOpen(false)
      setSelectedId(id)
      setLocked(false)
      exitPointerLockQuietly()
    },
    [exitPointerLockQuietly],
  )

  const handleCloseProject = useCallback(() => {
    setSelectedId(null)
  }, [])

  const handleCloseHelp = useCallback(() => {
    setHelpOpen(false)
    setNearbyId(null)
  }, [])

  useEffect(() => {
    const onPointerLockChange = () => {
      const lockedNow = Boolean(document.pointerLockElement)
      if (wasPointerLocked.current && !lockedNow) {
        if (!suppressHelpOnUnlock.current && !helpOpenRef.current) {
          openHelp()
        }
        suppressHelpOnUnlock.current = false
      }
      wasPointerLocked.current = lockedNow
      setLocked(lockedNow)
    }

    document.addEventListener('pointerlockchange', onPointerLockChange)
    return () => document.removeEventListener('pointerlockchange', onPointerLockChange)
  }, [openHelp])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return
      e.preventDefault()

      if (helpOpenRef.current) {
        setHelpOpen(false)
        setNearbyId(null)
        return
      }

      setSelectedId(null)
      setNearbyId(null)

      if (document.pointerLockElement) {
        return
      }

      setHelpOpen(true)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 120, position: [0, 1.7, 10] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#c8cfd6')
        }}
      >
        <Suspense fallback={null}>
          <Scene />
          <Buildings />
          <FirstPerson
            enabled={started && !blocked}
            locked={locked && !blocked}
            canSwing={!nearbyId}
            onLock={() => {
              setStarted(true)
              setLocked(true)
            }}
            onUnlock={() => setLocked(false)}
          />
          {started && !blocked && (
            <ProximityInteraction
              enabled
              onNearby={setNearbyId}
              onSelect={handleSelect}
            />
          )}
        </Suspense>
      </Canvas>

      {!started && !helpOpen && (
        <div className="start-screen">
          <div className="start-copy">
            <p className="brand">THE FIELD</p>
            <h1>Walk the portfolio</h1>
            <p className="lede">
              A doodle world of buildings — each one a project. Walk up close, then enter.
            </p>
            <button
              type="button"
              className="btn primary start-cta"
              onClick={() => {
                setStarted(true)
                const canvas = document.querySelector('canvas')
                canvas?.requestPointerLock?.()
              }}
            >
              Click to explore
            </button>
          </div>
        </div>
      )}

      {started && !blocked && (
        <>
          <div className="hud">
            <span>WASD move</span>
            <span className="dot">·</span>
            <span>Shift sprint</span>
            <span className="dot">·</span>
            <span>Space jump</span>
            <span className="dot">·</span>
            <span>click swing</span>
            <span className="dot">·</span>
            <span>Esc guide</span>
          </div>
          <div className={`crosshair ${nearbyId ? 'hot' : ''}`} aria-hidden />
          {nearby ? (
            <div className="enter-prompt" aria-live="polite">
              {nearby.enterLabel}
              <span className="enter-prompt-sub">{nearby.title} · left click or E</span>
            </div>
          ) : (
            !locked && (
              <div className="reticle-hint">Click the field to look around</div>
            )
          )}
        </>
      )}

      {selected && <ProjectOverlay project={selected} onClose={handleCloseProject} />}
      {helpOpen && <HelpOverlay onClose={handleCloseHelp} />}
    </div>
  )
}
