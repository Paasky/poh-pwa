import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { TypeKey } from "@/Common/Objects/World";

const baseMeshLib = {
  // todo test these once pink boxes work
  //"platformType:human": getBaseHuman,
  //"platformType:horse": getBaseHorse,
  //"platformType:chariot": getBaseChariot,
  //"platformType:raft": getBaseRaft,
  //"platformType:galley": getBaseGalley,
} as Record<TypeKey, (scene: Scene) => Mesh>;

export function objectBaseMesh(scene: Scene, typeKey: TypeKey): Mesh {
  const mesh = baseMeshLib[typeKey] ? baseMeshLib[typeKey](scene) : baseNaMesh(scene, typeKey);
  mesh.isVisible = true;
  mesh.isPickable = false;
  mesh.checkCollisions = false;
  mesh.receiveShadows = false;
  mesh.doNotSyncBoundingInfo = true;
  mesh.freezeWorldMatrix();
  return mesh;
}

function baseNaMesh(scene: Scene, typeKey: TypeKey): Mesh {
  const size = 1;
  const mesh = MeshBuilder.CreateBox(`baseNaMesh-${typeKey}`, { size }, scene);
  mesh.material = colorMat(scene, 1, 0, 1); // bright pink
  return mesh;
}

// All returned meshes are masters intended for instancing. Keep max dimension ≤ 1 unit.

function getBaseHuman(scene: Scene): Mesh {
  const root = new Mesh("baseHuman", scene);

  // Colors
  const bodyMat = colorMat(scene, 0.2, 0.2, 0.2);
  const headMat = colorMat(scene, 0.95, 0.8, 0.7);

  // Body (torso)
  const bodyH = 0.35;
  const body = MeshBuilder.CreateCylinder(
    "humanBody",
    { height: bodyH, diameter: 0.08, tessellation: 6 },
    scene,
  );
  body.position.y = bodyH / 2 + 0.25;
  body.material = bodyMat;
  body.parent = root;

  // Head (sphere)
  const head = MeshBuilder.CreateSphere("humanHead", { diameter: 0.12, segments: 8 }, scene);
  head.position.y = body.position.y + bodyH / 2 + 0.12 / 2;
  head.material = headMat;
  head.parent = root;

  // Limb master (thin cylinder)
  const limbMaster = MeshBuilder.CreateCylinder(
    "humanLimbMaster",
    { height: 0.28, diameter: 0.04, tessellation: 3 },
    scene,
  );
  limbMaster.isVisible = false;
  limbMaster.material = bodyMat;

  // Legs
  const legY = 0.28 / 2;
  const legOffset = 0.04;
  const legL = limbMaster.createInstance("humanLegL");
  legL.position = new Vector3(-legOffset, legY, 0);
  legL.parent = root;
  const legR = limbMaster.createInstance("humanLegR");
  legR.position = new Vector3(legOffset, legY, 0);
  legR.parent = root;

  // Arms
  const arm = limbMaster.createInstance("humanArmL");
  arm.scaling.y = 0.8;
  arm.position = new Vector3(-0.09, body.position.y + 0.03, 0);
  arm.rotation.z = 0.3;
  arm.parent = root;
  const arm2 = limbMaster.createInstance("humanArmR");
  arm2.scaling.y = 0.8;
  arm2.position = new Vector3(0.09, body.position.y + 0.03, 0);
  arm2.rotation.z = -0.3;
  arm2.parent = root;

  root.isVisible = false;
  return root;
}

function getBaseHorse(scene: Scene): Mesh {
  const root = new Mesh("baseHorse", scene);

  const bodyMat = colorMat(scene, 0.35, 0.23, 0.15);

  // Body (capsule-like using a scaled sphere + box)
  const body = MeshBuilder.CreateBox("horseBody", { width: 0.5, height: 0.18, depth: 0.22 }, scene);
  body.material = bodyMat;
  body.position.y = 0.32;
  body.parent = root;

  // Neck
  const neck = MeshBuilder.CreateCylinder(
    "horseNeck",
    { height: 0.22, diameter: 0.08, tessellation: 6 },
    scene,
  );
  neck.position = new Vector3(0.25, 0.42, 0);
  neck.rotation.z = -0.6;
  neck.material = bodyMat;
  neck.parent = root;

  // Head
  const head = MeshBuilder.CreateSphere("horseHead", { diameter: 0.12, segments: 8 }, scene);
  head.position = new Vector3(0.34, 0.48, 0);
  head.material = bodyMat;
  head.parent = root;

  // Tail (small cone)
  const tail = MeshBuilder.CreateCylinder(
    "horseTail",
    { height: 0.12, diameterTop: 0.01, diameterBottom: 0.05, tessellation: 6 },
    scene,
  );
  tail.position = new Vector3(-0.28, 0.36, 0);
  tail.rotation.z = 0.8;
  tail.material = bodyMat;
  tail.parent = root;

  // Leg master
  const legMaster = MeshBuilder.CreateCylinder(
    "horseLegMaster",
    { height: 0.32, diameter: 0.05, tessellation: 3 },
    scene,
  );
  legMaster.isVisible = false;
  legMaster.material = bodyMat;

  const yLeg = 0.32 / 2;
  const x = 0.18;
  const z = 0.09;
  const lf = legMaster.createInstance("horseLF");
  lf.position = new Vector3(x, yLeg, -z);
  lf.parent = root;
  const rf = legMaster.createInstance("horseRF");
  rf.position = new Vector3(x - 0.12, yLeg, z);
  rf.parent = root;
  const lr = legMaster.createInstance("horseLR");
  lr.position = new Vector3(-x, yLeg, -z);
  lr.parent = root;
  const rr = legMaster.createInstance("horseRR");
  rr.position = new Vector3(-x + 0.12, yLeg, z);
  rr.parent = root;

  root.isVisible = false;
  return root;
}

function getBaseChariot(scene: Scene): Mesh {
  const root = new Mesh("baseChariot", scene);

  const cartMat = colorMat(scene, 0.25, 0.18, 0.1);
  const wheelMat = colorMat(scene, 0.1, 0.1, 0.1);

  // Cart box
  const cart = MeshBuilder.CreateBox(
    "chariotCart",
    { width: 0.32, height: 0.18, depth: 0.22 },
    scene,
  );
  cart.position = new Vector3(-0.15, 0.18 / 2 + 0.05, 0);
  cart.material = cartMat;
  cart.parent = root;

  // Wheels (thin cylinders) - instance
  const wheelMaster = MeshBuilder.CreateCylinder(
    "chariotWheelMaster",
    { height: 0.04, diameter: 0.18, tessellation: 12 },
    scene,
  );
  wheelMaster.material = wheelMat;
  wheelMaster.rotation.x = Math.PI / 2;
  wheelMaster.isVisible = false;
  const w1 = wheelMaster.createInstance("chariotWheelL");
  w1.position = new Vector3(-0.28, 0.11, -0.13);
  w1.parent = root;
  const w2 = wheelMaster.createInstance("chariotWheelR");
  w2.position = new Vector3(-0.28, 0.11, 0.13);
  w2.parent = root;

  // Shafts towards horse
  const shaftMaster = MeshBuilder.CreateCylinder(
    "chariotShaftMaster",
    { height: 0.4, diameter: 0.03, tessellation: 3 },
    scene,
  );
  shaftMaster.isVisible = false;
  shaftMaster.material = cartMat;
  const s1 = shaftMaster.createInstance("chariotShaftL");
  s1.position = new Vector3(-0.02, 0.22, -0.07);
  s1.rotation.z = 0.05;
  s1.parent = root;
  const s2 = shaftMaster.createInstance("chariotShaftR");
  s2.position = new Vector3(-0.02, 0.22, 0.07);
  s2.rotation.z = 0.05;
  s2.parent = root;

  // Optional yoke
  const yoke = MeshBuilder.CreateCylinder(
    "chariotYoke",
    { height: 0.18, diameter: 0.03, tessellation: 3 },
    scene,
  );
  yoke.position = new Vector3(0.18, 0.22, 0);
  yoke.rotation.x = Math.PI / 2;
  yoke.material = cartMat;
  yoke.parent = root;

  // Horse: reuse base horse by cloning its hierarchy and parenting under chariot root
  // This composes the chariot from existing base units for visual consistency.
  const horseMaster = getBaseHorse(scene);
  const horse = horseMaster.clone("chariotHorse", root) as Mesh | null;
  if (horse) {
    // Place the horse a bit in front so the yoke meets its chest
    horse.position = new Vector3(0.3, 0, 0);
  }

  root.isVisible = false;
  return root;
}

function getBaseRaft(scene: Scene): Mesh {
  const root = new Mesh("baseRaft", scene);

  const wood = colorMat(scene, 0.45, 0.32, 0.18);

  // Elongated hexagon base using a 6-sided cylinder scaled on X
  const base = MeshBuilder.CreateCylinder(
    "raftBase",
    { height: 0.06, diameter: 0.6, tessellation: 6 },
    scene,
  );
  base.rotation.y = Math.PI / 6; // pointy top like tile
  base.scaling.x = 1.8;
  base.material = wood;
  base.position.y = 0.06 / 2;
  base.parent = root;

  // Mast
  const mast = MeshBuilder.CreateCylinder(
    "raftMast",
    { height: 0.6, diameter: 0.035, tessellation: 3 },
    scene,
  );
  mast.position = new Vector3(0, 0.06 + 0.6 / 2, 0);
  mast.material = wood;
  mast.parent = root;

  // Sail (square plane)
  const sail = MeshBuilder.CreatePlane("raftSail", { width: 0.35, height: 0.35 }, scene);
  sail.position = new Vector3(0, 0.38, -0.01);
  sail.rotation.y = Math.PI;
  sail.material = colorMat(scene, 0.95, 0.95, 0.95);
  sail.parent = root;

  root.isVisible = false;
  return root;
}

function getBaseGalley(scene: Scene): Mesh {
  const root = new Mesh("baseGalley", scene);

  const wood = colorMat(scene, 0.4, 0.28, 0.16);

  // Hull: elongated hexagon like raft but longer and thinner
  const hull = MeshBuilder.CreateCylinder(
    "galleyHull",
    { height: 0.06, diameter: 0.55, tessellation: 6 },
    scene,
  );
  hull.rotation.y = Math.PI / 6;
  hull.scaling.x = 2.2;
  hull.scaling.z = 0.9;
  hull.material = wood;
  hull.position.y = 0.06 / 2;
  hull.parent = root;

  // Oar master
  const oarMaster = MeshBuilder.CreateCylinder(
    "galleyOarMaster",
    { height: 0.28, diameter: 0.025, tessellation: 3 },
    scene,
  );
  oarMaster.isVisible = false;
  oarMaster.material = wood;
  // Create 6 oars per side
  const oarCount = 6;
  for (let i = 0; i < oarCount; i++) {
    const t = (i / (oarCount - 1)) * 0.6 - 0.3; // spread along X
    const left = oarMaster.createInstance(`galleyOarL${i}`);
    left.position = new Vector3(t, 0.14, -0.16);
    left.rotation.x = 0.2;
    left.rotation.z = 0.1;
    left.parent = root;
    const right = oarMaster.createInstance(`galleyOarR${i}`);
    right.position = new Vector3(t, 0.14, 0.16);
    right.rotation.x = 0.2;
    right.rotation.z = -0.1;
    right.parent = root;
  }

  // Small central mast + tiny sail to differentiate
  const mast = MeshBuilder.CreateCylinder(
    "galleyMast",
    { height: 0.45, diameter: 0.03, tessellation: 3 },
    scene,
  );
  mast.position = new Vector3(0, 0.06 + 0.45 / 2, 0);
  mast.material = wood;
  mast.parent = root;
  const sail = MeshBuilder.CreatePlane("galleySail", { width: 0.28, height: 0.22 }, scene);
  sail.position = new Vector3(0, 0.3, -0.01);
  sail.rotation.y = Math.PI;
  sail.material = colorMat(scene, 0.9, 0.9, 0.9);
  sail.parent = root;

  root.isVisible = false;
  return root;
}

// Local helper
const colorMat = (scene: Scene, r: number, g: number, b: number): StandardMaterial => {
  const m = new StandardMaterial("tmp", scene);
  m.diffuseColor = new Color3(r, g, b);
  m.specularColor = Color3.Black();
  return m;
};
