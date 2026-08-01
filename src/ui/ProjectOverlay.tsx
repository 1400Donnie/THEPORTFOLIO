import type { Project } from '../data/projects'

export function ProjectOverlay({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const hasLink = Boolean(project.url)

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-labelledby="project-title">
      <div className="overlay-panel">
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="overlay-kicker">Building</p>
        <h2 id="project-title">{project.title}</h2>
        <p className="overlay-blurb">{project.blurb}</p>
        <div className="overlay-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Back to field
          </button>
          {hasLink ? (
            <a
              className="btn primary"
              href={project.url!}
              target="_blank"
              rel="noreferrer noopener"
            >
              Open live link
            </a>
          ) : (
            <button type="button" className="btn primary" disabled title="Add a URL in projects.ts">
              Open live link
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
