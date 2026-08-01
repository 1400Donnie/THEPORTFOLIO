export type Project = {
  id: string
  title: string
  blurb: string
  url: string | null
  enterLabel: string
  position: [number, number, number]
  rotation: number
  kind: 'cottage' | 'barn' | 'well' | 'workshop'
}

/**
 * Four landmarks:
 *   spawn → path → wishing well
 *   three house paths radiate from the well (north, west, east)
 */
export const projects: Project[] = [
  {
    id: 'well',
    title: 'Project One',
    blurb: 'An old wishing well at the heart of town. Content coming soon.',
    url: null,
    enterLabel: 'Inspect well',
    position: [0, 0, -8],
    rotation: 0.35,
    kind: 'well',
  },
  {
    id: 'cottage',
    title: 'Project Two',
    blurb: 'A cottage at the north end of the path. Swap this for a real case study later.',
    url: null,
    enterLabel: 'Enter house',
    position: [0, 0, -22],
    rotation: Math.PI,
    kind: 'cottage',
  },
  {
    id: 'workshop',
    title: 'Project Three',
    blurb: 'A workshop at the west end of the path. Your build notes will live here.',
    url: null,
    enterLabel: 'Enter house',
    position: [-16, 0, -8],
    rotation: Math.PI / 2,
    kind: 'workshop',
  },
  {
    id: 'barn',
    title: 'Project Four',
    blurb: 'A barn at the east end of the path. Placeholder for one of your works.',
    url: null,
    enterLabel: 'Enter house',
    position: [16, 0, -8],
    rotation: -Math.PI / 2,
    kind: 'barn',
  },
]

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}
