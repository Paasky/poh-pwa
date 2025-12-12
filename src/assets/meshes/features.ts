import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3, } from '@babylonjs/core'

// All base meshes follow a normalized scale where no dimension exceeds 1 unit.
// Returned meshes are intended to be master meshes for instancing, thus hidden by default.

export type FeatureGroup = 'pineTree' | 'leafTree' | 'jungleTree' | 'palmTree' | 'bush' | 'kelp' | 'ice' | 'atoll'

export const featureMeshMap = {
  pineTree: getBasePineTree,
  leafTree: getBaseLeafTree,
  jungleTree: getBaseJungleTree,
  palmTree: getBasePalmTree,
  bush: getBaseBush,
  kelp: getBaseKelp,
  ice: getBaseIce,
  atoll: getBaseAtoll,
} as Record<FeatureGroup, (scene: Scene) => Mesh>

export function getBasePineTree (scene: Scene): Mesh {
  // Trunk
  const basePineTree = MeshBuilder.CreateCylinder(
    'basePineTree',
    { height: 0.3, diameter: 0.08, tessellation: 3 },
    scene,
  )
  basePineTree.position.y = 0.3 / 2
  basePineTree.material = colorMat(scene, 0.36, 0.22, 0.12) // brown

  // Foliage: 12-sided cone
  const cone = MeshBuilder.CreateCylinder(
    'pineCone',
    { height: 0.7, diameterTop: 0, diameterBottom: 0.5, tessellation: 12 },
    scene,
  )
  cone.position.y = 0.3 + 0.7 / 2
  cone.material = colorMat(scene, 0.0, 0.35, 0.0) // dark green
  // Return a single merged mesh (preserves materials via submeshes)
  const merged = Mesh.MergeMeshes([
    basePineTree,
    cone,
  ], true, true, undefined, false, true)!
  merged.isVisible = false
  return merged
}

export function getBaseLeafTree (scene: Scene): Mesh {
  // Pole
  const baseLeafTree = MeshBuilder.CreateCylinder(
    'baseLeafTree',
    { height: 0.3, diameter: 0.08, tessellation: 3 },
    scene,
  )
  baseLeafTree.position.y = 0.3 / 2
  baseLeafTree.material = colorMat(scene, 0.36, 0.22, 0.12) // brown

  // Oval foliage (sphere scaled on Y)
  const ball = MeshBuilder.CreateSphere('leafBall', { diameter: 0.6, segments: 12 }, scene)
  ball.scaling = new Vector3(1, 0.8, 1)
  ball.position.y = 0.3 + (0.6 * 0.8) / 2
  ball.material = colorMat(scene, 0.4, 0.8, 0.35) // light green
  const merged = Mesh.MergeMeshes([
    baseLeafTree,
    ball,
  ], true, true, undefined, false, true)!
  merged.isVisible = false
  return merged
}

export function getBaseJungleTree (scene: Scene): Mesh {
  // Long stick
  const baseJungleTree = MeshBuilder.CreateCylinder(
    'baseJungleTree',
    { height: 0.5, diameter: 0.07, tessellation: 3 },
    scene,
  )
  baseJungleTree.position.y = 0.5 / 2
  baseJungleTree.material = colorMat(scene, 0.36, 0.22, 0.12) // brown

  // Capsule foliage
  const cap = MeshBuilder.CreateCapsule(
    'jungleCapsule',
    { height: 0.5, radius: 0.15, tessellation: 12 },
    scene,
  )
  cap.position.y = 0.5 + 0.5 / 2
  cap.material = colorMat(scene, 0.0, 0.35, 0.0) // dark green
  const merged = Mesh.MergeMeshes([
    baseJungleTree,
    cap,
  ], true, true, undefined, false, true)!
  merged.isVisible = false
  return merged
}

export function getBasePalmTree (scene: Scene): Mesh {
  // Single slightly-bent trunk built as a tube along a curved path
  const height = 0.8
  const steps = 8
  const path: Vector3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = height * t
    // gentle S-shape bend with a small forward offset
    const x = 0.02 * Math.sin(t * Math.PI * 0.6) + 0.06 * t
    path.push(new Vector3(x, y, 0))
  }

  const basePalmTree = MeshBuilder.CreateTube(
    'basePalmTree',
    {
      path,
      // taper from ~0.07 at base to ~0.055 at the top
      radiusFunction: (i) => {
        const t = i / steps
        return 0.07 * (1 - 0.2 * t)
      },
      tessellation: 8,
      cap: Mesh.CAP_ALL,
    },
    scene,
  )
  basePalmTree.material = colorMat(scene, 0.45, 0.32, 0.18)
  // Lift by base radius so no part dips below Y=0
  basePalmTree.position.y = 0.07

  // Leaves: 6 triangular prisms flattened and fanned around the top
  const leafMat = colorMat(scene, 0.0, 0.5, 0.2)
  const top = path[path.length - 1]
  // Build actual leaf meshes so we can merge them with the trunk
  const leafMeshes: Mesh[] = []
  for (let i = 0; i < 6; i++) {
    const leaf = MeshBuilder.CreateCylinder(
      `palmLeaf${i}`,
      { height: 0.35, diameter: 0.07, tessellation: 3 },
      scene,
    )
    // slight natural variance per leaf
    const variance = 0.9 + (i % 3) * 0.05
    leaf.scaling = new Vector3(0.4, variance, variance) // flatten X
    leaf.material = leafMat
    leaf.position = new Vector3(top.x, top.y + basePalmTree.position.y, top.z)
    leaf.rotation.y = (i * Math.PI * 2) / 6
    leaf.rotation.x = -0.9
    leafMeshes.push(leaf)
  }

  const merged = Mesh.MergeMeshes([
    basePalmTree,
    ...leafMeshes,
  ], true, true, undefined, false, true)!
  merged.isVisible = false
  return merged
}

export function getBaseBush (scene: Scene): Mesh {
  const baseBush = MeshBuilder.CreateBox('baseBush', { size: 0.3 }, scene)
  baseBush.position.y = 0.3 / 2
  baseBush.material = colorMat(scene, 0.36, 0.22, 0.12) // brown
  baseBush.isVisible = false
  return baseBush
}

export function getBaseKelp (scene: Scene): Mesh {
  const baseKelp = MeshBuilder.CreateCylinder(
    'baseKelp',
    { height: 1.0, diameter: 0.07, tessellation: 3 },
    scene,
  )
  baseKelp.position.y = 1.0 / 2
  baseKelp.material = colorMat(scene, 0.0, 0.3, 0.0) // dark green
  baseKelp.isVisible = false
  return baseKelp
}

export function getBaseIce (scene: Scene): Mesh {
  const baseIce = MeshBuilder.CreateCylinder(
    'baseIce',
    { height: 0.3, diameterTop: 0, diameterBottom: 0.25, tessellation: 5 },
    scene,
  )
  // Ensure it sits on Y=0
  baseIce.position.y = 0.3 / 2
  baseIce.material = colorMat(scene, 0.95, 0.95, 1.0) // icy white
  baseIce.isVisible = false

  return baseIce
}

export function getBaseAtoll (scene: Scene): Mesh {
  // Crescent via tube following a circular arc (avoids using unsupported `arc` option on Torus)
  const diameter = 0.8
  const thickness = 0.12
  const centerR = diameter / 2 // 0.4
  const tubeR = thickness / 2 // 0.06
  const arcFraction = 0.7 // fraction of full circle
  const segments = 32

  const totalAngle = arcFraction * Math.PI * 2
  const start = -totalAngle / 2
  const end = totalAngle / 2
  const step = totalAngle / segments

  const path: Vector3[] = []
  for (let a = start; a <= end + 1e-6; a += step) {
    const x = Math.cos(a) * centerR
    const z = Math.sin(a) * centerR
    path.push(new Vector3(x, 0, z))
  }

  const baseAtoll = MeshBuilder.CreateTube(
    'baseAtoll',
    { path, radius: tubeR, tessellation: 24, cap: Mesh.CAP_ALL },
    scene,
  )
  // Keep orientation consistent with previous torus version
  baseAtoll.rotation.x = Math.PI / 2
  // Rotation would place some vertices below Y=0; lift by tube radius
  baseAtoll.position.y = tubeR
  baseAtoll.material = colorMat(scene, 1, 1, 1)
  baseAtoll.isVisible = false
  return baseAtoll
}

// Helpers
const colorMat = (scene: Scene, r: number, g: number, b: number): StandardMaterial => {
  // Give each color a stable, unique material name to avoid name collisions
  const rn = Math.round(r * 100)
  const gn = Math.round(g * 100)
  const bn = Math.round(b * 100)
  const name = `featureMat_${rn}_${gn}_${bn}`
  const m = new StandardMaterial(name, scene)
  m.diffuseColor = new Color3(r, g, b)
  m.specularColor = Color3.Black()
  return m
}
