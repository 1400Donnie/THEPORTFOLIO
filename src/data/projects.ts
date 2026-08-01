export type Project = {
  id: string
  title: string
  blurb: string
  url: string | null
  enterLabel: string
  position: [number, number, number]
  rotation: number
  kind:
    | 'tower'
    | 'cottage'
    | 'barn'
    | 'well'
    | 'gallery'
    | 'workshop'
    | 'archive'
}

/**
 * Little town layout (looking north from spawn):
 *   spawn → main street → well square → tower
 *   cottage / archive flank the well
 *   gallery + workshop on a cross street north of the well
 *   barn sits off the east spur
 */
export const projects: Project[] = [
  {
    id: 'well',
    title: 'Project Four',
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
    blurb: 'A small house on the west side of the square. Swap this for a real case study later.',
    url: null,
    enterLabel: 'Enter house',
    position: [-9.5, 0, -7.5],
    rotation: Math.PI / 2,
    kind: 'cottage',
  },
  {
    id: 'archive',
    title: 'Project Seven',
    blurb: 'A narrow archive hut on the east square. Last placeholder building for now.',
    url: null,
    enterLabel: 'Enter house',
    position: [8.5, 0, -7],
    rotation: -Math.PI / 2 + 0.15,
    kind: 'archive',
  },
  {
    id: 'tower',
    title: 'Project One',
    blurb: 'A tall landmark at the north end of the street. Add your project description here.',
    url: null,
    enterLabel: 'Enter house',
    position: [0, 0, -24],
    rotation: Math.PI,
    kind: 'tower',
  },
  {
    id: 'gallery',
    title: 'Project Five',
    blurb: 'A pavilion on the north-west lane. Wire a live demo link when ready.',
    url: null,
    enterLabel: 'Enter house',
    position: [-11, 0, -17],
    rotation: Math.PI / 2 + 0.2,
    kind: 'gallery',
  },
  {
    id: 'workshop',
    title: 'Project Six',
    blurb: 'Workshop with a chimney on the north-east lane. Your build notes will live here.',
    url: null,
    enterLabel: 'Enter house',
    position: [11, 0, -17.5],
    rotation: -Math.PI / 2 - 0.15,
    kind: 'workshop',
  },
  {
    id: 'barn',
    title: 'Project Three',
    blurb: 'A wide barn at the edge of town. Placeholder for one of your works.',
    url: null,
    enterLabel: 'Enter house',
    position: [16, 0, -2],
    rotation: -Math.PI / 2,
    kind: 'barn',
  },
]

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}
