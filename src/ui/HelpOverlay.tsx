export function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div className="overlay-panel help-panel">
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="overlay-kicker">Guide</p>
        <h2 id="help-title">How this world works</h2>
        <p className="overlay-blurb">
          This field is a walkable portfolio. Walk up to a building and aim at it — when you are
          close enough and looking at it, an Enter house prompt appears. Left click or press E to
          open that project.
        </p>
        <ul className="help-list">
          <li>
            <strong>Move</strong> with WASD (or arrow keys)
          </li>
          <li>
            <strong>Enter a house</strong> when close and aimed at it (left click or E)
          </li>
          <li>
            <strong>Escape</strong> pauses exploration and shows this guide
          </li>
        </ul>
        <p className="help-note">
          Building entry is paused while this guide is open. Close it to keep exploring.
        </p>
        <div className="overlay-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            Back to field
          </button>
        </div>
      </div>
    </div>
  )
}
