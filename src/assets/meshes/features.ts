import { Color3, InstancedMesh, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from '@babylonjs/core'

// All base meshes follow a normalized scale where no dimension exceeds 1 unit.
// Returned meshes are intended to be master meshes for instancing, thus hidden by default.

export const getBasePineTree = (scene: Scene): Mesh => {
  const root = new Mesh('basePineTree', scene)

  // Trunk
  const trunk = MeshBuilder.CreateCylinder(
    'pineTrunk',
    { height: 0.3, diameter: 0.08, tessellation: 3 },
    scene,
  )
  trunk.position.y = 0.3 / 2
  trunk.material = colorMat(scene, 0.36, 0.22, 0.12) // brown
  trunk.parent = root

  // Foliage: 12-sided cone
  const cone = MeshBuilder.CreateCylinder(
    'pineCone',
    { height: 0.7, diameterTop: 0, diameterBottom: 0.5, tessellation: 12 },
    scene,
  )
  cone.position.y = 0.3 + 0.7 / 2
  cone.material = colorMat(scene, 0.0, 0.35, 0.0) // dark green
  cone.parent = root

  root.isVisible = false
  return root
}

export const getBaseLeafTree = (scene: Scene): Mesh => {
  const root = new Mesh('baseLeafTree', scene)

  // Pole
  const pole = MeshBuilder.CreateCylinder(
    'leafPole',
    { height: 0.3, diameter: 0.08, tessellation: 3 },
    scene,
  )
  pole.position.y = 0.3 / 2
  pole.material = colorMat(scene, 0.36, 0.22, 0.12) // brown
  pole.parent = root

  // Oval foliage (sphere scaled on Y)
  const ball = MeshBuilder.CreateSphere('leafBall', { diameter: 0.6, segments: 12 }, scene)
  ball.scaling = new Vector3(1, 0.8, 1)
  ball.position.y = 0.3 + (0.6 * 0.8) / 2
  ball.material = colorMat(scene, 0.4, 0.8, 0.35) // light green
  ball.parent = root

  root.isVisible = false
  return root
}

export const getBaseJungleTree = (scene: Scene): Mesh => {
  const root = new Mesh('baseJungleTree', scene)

  // Long stick
  const stick = MeshBuilder.CreateCylinder(
    'jungleStick',
    { height: 0.5, diameter: 0.07, tessellation: 3 },
    scene,
  )
  stick.position.y = 0.5 / 2
  stick.material = colorMat(scene, 0.36, 0.22, 0.12) // brown
  stick.parent = root

  // Capsule foliage
  const cap = MeshBuilder.CreateCapsule(
    'jungleCapsule',
    { height: 0.5, radius: 0.15, tessellation: 12 },
    scene,
  )
  cap.position.y = 0.5 + 0.5 / 2
  cap.material = colorMat(scene, 0.0, 0.35, 0.0) // dark green
  cap.parent = root

  root.isVisible = false
  return root
}

export const getBasePalmTree = (scene: Scene): Mesh => {
  const root = new Mesh('basePalmTree', scene)

  // Bent trunk approximated by two segments
  const seg1 = MeshBuilder.CreateCylinder(
    'palmTrunk1',
    { height: 0.45, diameter: 0.07, tessellation: 3 },
    scene,
  )
  seg1.position = new Vector3(0, 0.45 / 2, 0)
  seg1.rotation.z = -0.15
  seg1.material = colorMat(scene, 0.45, 0.32, 0.18)
  seg1.parent = root

  const seg2 = MeshBuilder.CreateCylinder(
    'palmTrunk2',
    { height: 0.35, diameter: 0.065, tessellation: 3 },
    scene,
  )
  seg2.position = new Vector3(0.05, 0.45 + 0.35 / 2, 0)
  seg2.rotation.z = 0.2
  seg2.material = seg1.material
  seg2.parent = root

  // Leaves: 6 triangular prisms flattened and fanned around the top
  const leafMat = colorMat(scene, 0.0, 0.5, 0.2)
  const topY = 0.45 + 0.35
  // Use one master leaf and instance it 6 times for efficiency
  const leafMaster = MeshBuilder.CreateCylinder(
    'palmLeafMaster',
    { height: 0.35, diameter: 0.07, tessellation: 3 },
    scene,
  )
  leafMaster.scaling.x = 0.4 // flatten a bit
  leafMaster.material = leafMat
  leafMaster.isVisible = false
  for (let i = 0; i < 6; i++) {
    const leaf = leafMaster.createInstance(`palmLeaf${i}`)
    // slight natural variance per leaf
    const variance = 0.9 + (i % 3) * 0.05
    leaf.scaling = new Vector3(leafMaster.scaling.x, variance, variance)
    leaf.position = new Vector3(0.05, topY, 0)
    leaf.rotation.y = (i * Math.PI * 2) / 6
    leaf.rotation.x = -0.9
    leaf.parent = root
  }

  root.isVisible = false
  return root
}

export const getBaseBush = (scene: Scene): Mesh => {
  const root = new Mesh('baseBush', scene)
  const box = MeshBuilder.CreateBox('bushBox', { size: 0.3 }, scene)
  box.position.y = 0.3 / 2
  box.material = colorMat(scene, 0.36, 0.22, 0.12) // brown
  box.parent = root

  root.isVisible = false
  return root
}

export const getBaseKelp = (scene: Scene): Mesh => {
  const root = new Mesh('baseKelp', scene)
  const stalk = MeshBuilder.CreateCylinder(
    'kelpStalk',
    { height: 1.0, diameter: 0.07, tessellation: 3 },
    scene,
  )
  stalk.position.y = 1.0 / 2
  stalk.material = colorMat(scene, 0.0, 0.3, 0.0) // dark green
  stalk.parent = root

  root.isVisible = false
  return root
}

export const getBaseIce = (scene: Scene): InstancedMesh[] => {
  const mat = colorMat(scene, 0.95, 0.95, 1.0) // icy white

  // Use a single shard master and instance it 3 times with slight variations
  const shardMaster = MeshBuilder.CreateCylinder(
    'iceShardMaster',
    { height: 0.3, diameterTop: 0, diameterBottom: 0.25, tessellation: 5 },
    scene,
  )
  shardMaster.material = mat
  shardMaster.isVisible = false

  const i1 = shardMaster.createInstance('iceShard1')
  i1.position.y = 0.3 / 2
  i1.isVisible = false

  const i2 = shardMaster.createInstance('iceShard2')
  // shorter, slimmer variant
  i2.scaling = new Vector3(0.72, 0.66, 0.72)
  i2.position = new Vector3(0.2, (0.3 * 0.66) / 2, -0.1)
  i2.isVisible = false

  const i3 = shardMaster.createInstance('iceShard3')
  i3.scaling = new Vector3(0.8, 0.83, 0.8)
  i3.position = new Vector3(-0.2, (0.3 * 0.83) / 2, 0.1)
  i3.isVisible = false

  return [i1, i2, i3]
}

export const getBaseAtoll = (scene: Scene): Mesh => {
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

  const crescent = MeshBuilder.CreateTube(
    'baseAtoll',
    { path, radius: tubeR, tessellation: 24, cap: Mesh.CAP_ALL },
    scene,
  )
  // Keep orientation consistent with previous torus version
  crescent.rotation.x = Math.PI / 2
  crescent.material = colorMat(scene, 1, 1, 1)
  crescent.isVisible = false
  return crescent
}

// Helpers
const colorMat = (scene: Scene, r: number, g: number, b: number): StandardMaterial => {
  const m = new StandardMaterial('tmp', scene)
  m.diffuseColor = new Color3(r, g, b)
  m.specularColor = Color3.Black()
  return m
}