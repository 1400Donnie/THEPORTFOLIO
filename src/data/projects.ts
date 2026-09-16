export type Project = {
  id: string
  title: string
  blurb: string
  /** Set this to your live project URL — shown when the house is opened. */
  url: string | null
  enterLabel: string
  position: [number, number, number]
  rotation: number
  kind: 'cottage'
}

/**
 * Landmarks on the field.
 * Project One sits at the north end of the main path.
 */
export const projects: Project[] = [
  {
    id: 'project-one',
    title: 'Project One',
    blurb:
      'Walk up to this house and click (or press E) when the enter prompt appears. Add your live link below in projects.ts.',
    url: null,
    enterLabel: 'Enter house',
    position: [0, 0, -22],
    rotation: 0,
    kind: 'cottage',
  },
]

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}
