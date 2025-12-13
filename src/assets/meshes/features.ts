import {
  Color3,
  Matrix,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core"; // All base meshes follow a normalized scale where no dimension exceeds 1 unit.

// All base meshes follow a normalized scale where no dimension exceeds 1 unit.
// Returned meshes are intended to be master meshes for instancing, thus hidden by default.

export type FeatureGroup =
  | "pineTree"
  | "leafTree"
  | "jungleTree"
  | "palmTree"
  | "bush"
  | "kelp"
  | "ice"
  | "atoll"
  | "floodPlain"
  | "swamp"
  | "lagoon"
  | "tradeWind";

export const featureMeshMap = {
  pineTree: getBasePineTree,
  leafTree: getBaseLeafTree,
  jungleTree: getBaseJungleTree,
  palmTree: getBasePalmTree,
  bush: getBaseBush,
  kelp: getBaseKelp,
  ice: getBaseIce,
  atoll: getBaseAtoll,
  floodPlain: getBaseFloodPlain,
  swamp: getBaseSwamp,
  lagoon: getBaseLagoon,
  tradeWind: getBaseTradeWind,
} as Record<FeatureGroup, (scene: Scene) => Mesh>;

export function getBasePineTree(scene: Scene): Mesh {
  // Trunk
  const basePineTree = MeshBuilder.CreateCylinder(
    "basePineTree",
    { height: 0.3, diameter: 0.08, tessellation: 3 },
    scene,
  );
  basePineTree.position.y = 0.3 / 2;
  basePineTree.material = colorMat(scene, 0.36, 0.22, 0.12); // brown

  // Foliage: 12-sided cone
  const cone = MeshBuilder.CreateCylinder(
    "pineCone",
    { height: 0.7, diameterTop: 0, diameterBottom: 0.5, tessellation: 12 },
    scene,
  );
  cone.position.y = 0.3 + 0.7 / 2;
  cone.material = colorMat(scene, 0.0, 0.35, 0.0); // dark green
  // Return a single merged mesh (preserves materials via submeshes)
  const merged = Mesh.MergeMeshes([basePineTree, cone], true, true, undefined, false, true)!;
  merged.isVisible = false;
  return merged;
}

export function getBaseLeafTree(scene: Scene): Mesh {
  // Pole
  const baseLeafTree = MeshBuilder.CreateCylinder(
    "baseLeafTree",
    { height: 0.3, diameter: 0.08, tessellation: 3 },
    scene,
  );
  baseLeafTree.position.y = 0.3 / 2;
  baseLeafTree.material = colorMat(scene, 0.36, 0.22, 0.12); // brown

  // Oval foliage (sphere scaled on Y)
  const ball = MeshBuilder.CreateSphere("leafBall", { diameter: 0.4, segments: 12 }, scene);
  ball.scaling = new Vector3(1, 2, 1);
  ball.position.y = 0.6;
  ball.material = colorMat(scene, 0.0, 0.55, 0.0); // light green
  const merged = Mesh.MergeMeshes([baseLeafTree, ball], true, true, undefined, false, true)!;
  merged.isVisible = false;
  return merged;
}

export function getBaseJungleTree(scene: Scene): Mesh {
  // Long stick
  const baseJungleTree = MeshBuilder.CreateCylinder(
    "baseJungleTree",
    { height: 0.5, diameter: 0.07, tessellation: 3 },
    scene,
  );
  baseJungleTree.position.y = 0.5 / 2;
  baseJungleTree.material = colorMat(scene, 0.36, 0.22, 0.12); // brown

  // Capsule foliage
  const cap = MeshBuilder.CreateCapsule(
    "jungleCapsule",
    { height: 1, radius: 0.25, tessellation: 12 },
    scene,
  );
  cap.position.y = 0.5 + 0.5 / 2;
  cap.material = colorMat(scene, 0.0, 0.45, 0.0); // dark green
  const merged = Mesh.MergeMeshes([baseJungleTree, cap], true, true, undefined, false, true)!;
  merged.isVisible = false;
  return merged;
}

export function getBasePalmTree(scene: Scene): Mesh {
  // KISS hardcoded palm:
  // - Trunk: 3 straight segments, each 0.2 long (total 0.6)
  // - Segment directions bend from vertical: 0°, 10°, 30° (toward +X)
  // - Leaves: 6 pieces, 0.3 long, at the trunk tip, evenly spaced, aligned to final 30° direction

  // Build trunk path
  const segLen = 0.2;
  const deg2rad = (d: number) => (d * Math.PI) / 180;
  const angles = [0, 10, 30].map(deg2rad); // from vertical toward +X
  const dirs = angles.map((a) => new Vector3(Math.sin(a), Math.cos(a), 0));
  const path: Vector3[] = [];
  let p = new Vector3(0, 0, 0);
  path.push(p.clone());
  for (const d of dirs) {
    p = p.add(d.scale(segLen));
    path.push(p.clone());
  }

  // Tube trunk with slight taper
  const baseRadius = 0.05;
  const basePalmTree = MeshBuilder.CreateTube(
    "basePalmTree",
    {
      path,
      radiusFunction: (i) => {
        const t = i / (path.length - 1);
        return baseRadius * (1 - 0.15 * t);
      },
      tessellation: 8,
      cap: Mesh.CAP_ALL,
    },
    scene,
  );
  basePalmTree.material = colorMat(scene, 0.45, 0.32, 0.18);
  // Lift by base radius so nothing dips below ground
  basePalmTree.position.y = baseRadius;

  // Compute final tangent (30° direction)
  const top = path[path.length - 1];
  const prev = path[path.length - 2];
  const tangent = top.subtract(prev).normalize(); // should equal dirs[2]

  // Align +Y to tangent helper
  const buildAlignYTo = (target: Vector3): Quaternion => {
    const up = target.normalizeToRef(new Vector3());
    const v0 = Vector3.Up();
    const dot = Vector3.Dot(v0, up);
    if (dot > 0.999999) return Quaternion.Identity();
    if (dot < -0.999999) return Quaternion.RotationAxis(Vector3.Right(), Math.PI);
    const axis = Vector3.Cross(v0, up).normalize();
    const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
    return Quaternion.RotationAxis(axis, angle);
  };
  const qAlign = buildAlignYTo(tangent);

  // Leaves
  const leafMat = colorMat(scene, 0.0, 0.5, 0.2);
  const leafMeshes: Mesh[] = [];
  const leafLen = 0.3;
  // Build a local frame around the trunk tangent so we can pitch leaves "down"
  // t = tangent (local +Y). Choose a stable binormal and normal.
  const t = tangent;
  let b = Vector3.Cross(t, Vector3.Up());
  if (b.lengthSquared() < 1e-6) {
    // Fallback if tangent is nearly parallel to Up
    b = Vector3.Cross(t, Vector3.Right());
  }
  b.normalize();
  const u = Vector3.Cross(b, t).normalize(); // completes orthonormal basis
  const pitchDown = deg2rad(100); // rotate 100° down from the tangent
  for (let i = 0; i < 6; i++) {
    const leaf = MeshBuilder.CreateCylinder(
      `palmLeaf${i}`,
      { height: leafLen, diameter: 0.06, tessellation: 3 },
      scene,
    );
    // Make it flatter like a leaf
    leaf.scaling = new Vector3(0.35, 1, 1);
    leaf.material = leafMat;
    // Shift so base is at local origin (attach point)
    leaf.bakeTransformIntoVertices(Matrix.Translation(0, leafLen / 2, 0));
    // Place at trunk tip (account for trunk lift)
    leaf.position = new Vector3(top.x, top.y + basePalmTree.position.y, top.z);
    // Orientation:
    // 1) Align +Y to trunk tangent (qAlign)
    // 2) Fan evenly around the tangent (every 60°) -> qFan
    // 3) Pitch 100° "down" away from the tangent around the radial axis r -> qPitch
    const a = (i * Math.PI * 2) / 6;
    const qFan = Quaternion.RotationAxis(t, a);
    // Radial axis r obtained by rotating u around t by angle a
    const r = u
      .scale(Math.cos(a))
      .add(b.scale(Math.sin(a)))
      .normalize();
    const qPitch = Quaternion.RotationAxis(r, -pitchDown);
    leaf.rotationQuaternion = qPitch.multiply(qFan).multiply(qAlign);
    leafMeshes.push(leaf);
  }

  const merged = Mesh.MergeMeshes(
    [basePalmTree, ...leafMeshes],
    true,
    true,
    undefined,
    false,
    true,
  )!;
  merged.isVisible = false;
  return merged;
}

export function getBaseBush(scene: Scene): Mesh {
  // Half-size bush that still rests on the ground (Y=0)
  const size = 0.1;
  const baseBush = MeshBuilder.CreateBox("baseBush", { size }, scene);
  baseBush.position.y = size / 2; // keep bottom at Y=0
  baseBush.material = colorMat(scene, 0.36, 0.22, 0.12); // brown
  baseBush.isVisible = false;
  return baseBush;
}

export function getBaseKelp(scene: Scene): Mesh {
  const baseKelp = MeshBuilder.CreateCylinder(
    "baseKelp",
    { height: 1.0, diameter: 0.1, tessellation: 3 },
    scene,
  );
  baseKelp.position.y = -0.6;
  baseKelp.material = colorMat(scene, 0.0, 0.3, 0.0); // dark green
  baseKelp.isVisible = false;
  return baseKelp;
}

export function getBaseIce(scene: Scene): Mesh {
  // Inverted cone (iceberg-like): point down, 3x larger, with the top at +0.1 local Y
  const height = 0.9; // 0.9
  const topDia = 0.75; // 0.75
  const baseIce = MeshBuilder.CreateCylinder(
    "baseIce",
    { height, diameterTop: topDia, diameterBottom: 0, tessellation: 5 },
    scene,
  );
  // Place so that the flat top is at Y = +0.1; spike extends below Y=0
  baseIce.position.y = 0.1 - height / 2;
  baseIce.material = colorMat(scene, 0.95, 0.95, 1.0); // icy white
  baseIce.isVisible = false;

  return baseIce;
}

export function getBaseAtoll(scene: Scene): Mesh {
  // Crescent via tube following a circular arc (avoids using unsupported `arc` option on Torus)
  const diameter = 0.8;
  const thickness = 0.2;
  const centerR = diameter / 2; // 0.4
  const tubeR = thickness / 2; // 0.06
  const arcFraction = 0.7; // fraction of full circle
  const segments = 32;

  const totalAngle = arcFraction * Math.PI * 2;
  const start = -totalAngle / 2;
  const end = totalAngle / 2;
  const step = totalAngle / segments;

  const path: Vector3[] = [];
  for (let a = start; a <= end + 1e-6; a += step) {
    const x = Math.cos(a) * centerR;
    const z = Math.sin(a) * centerR;
    path.push(new Vector3(x, 0, z));
  }

  const baseAtoll = MeshBuilder.CreateTube(
    "baseAtoll",
    { path, radius: tubeR, tessellation: 24, cap: Mesh.CAP_ALL },
    scene,
  );
  // The path is defined in the XZ plane so the atoll lies flat on the water surface.
  // Lift by tube radius so no part dips below Y=0
  baseAtoll.position.y = -tubeR / 2;
  baseAtoll.material = colorMat(scene, 1, 1, 1);
  baseAtoll.isVisible = false;
  return baseAtoll;
}

export function getBaseFloodPlain(scene: Scene): Mesh {
  // A reed: thin, ~0.5 tall, a little tuft at top
  const baseReed = MeshBuilder.CreateCylinder(
    "baseReedStem",
    { height: 0.25, diameter: 0.03, tessellation: 6 },
    scene,
  );
  baseReed.position.y = 0.125;
  baseReed.material = colorMat(scene, 0.2, 0.5, 0.2);

  baseReed.isVisible = false;
  return baseReed;
}

export function getBaseSwamp(scene: Scene): Mesh {
  // Thin cylinder (disc) with light caribbean blue
  const baseSwamp = MeshBuilder.CreateCylinder(
    "baseSwamp",
    { height: 0.02, diameter: 0.5, tessellation: 12 },
    scene,
  );
  baseSwamp.position.y = -0.03;
  baseSwamp.material = colorMat(scene, 0.25, 0.3, 0.25); // very dark green-brown
  baseSwamp.isVisible = false;

  return baseSwamp;
}

export function getBaseLagoon(scene: Scene): Mesh {
  // Thin cylinder (disc) with light caribbean blue
  const baseLagoon = MeshBuilder.CreateCylinder(
    "baseLagoon",
    { height: 0.02, diameter: 1.25, tessellation: 24 },
    scene,
  );
  baseLagoon.position.y = -0.03;
  baseLagoon.material = colorMat(scene, 0.2, 0.9, 0.95);
  baseLagoon.isVisible = false;
  return baseLagoon;
}

export function getBaseTradeWind(scene: Scene): Mesh {
  // Thin wavy arrow pointing +X by default (we'll rotate to west as needed)
  const segments = 16;
  const length = 0.6;
  const amplitude = 0.05;
  const path: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -length / 2 + length * t;
    const z = Math.sin(t * Math.PI * 2) * amplitude;
    path.push(new Vector3(x, 0, z));
  }
  const shaft = MeshBuilder.CreateTube(
    "tradeWindShaft",
    { path, radius: 0.02, tessellation: 12, cap: Mesh.CAP_ALL },
    scene,
  );
  shaft.material = colorMat(scene, 0.9, 0.95, 1.0);

  // Arrow head at +X end
  const head = MeshBuilder.CreateCylinder(
    "tradeWindHead",
    { height: 0.12, diameterTop: 0, diameterBottom: 0.1, tessellation: 6 },
    scene,
  );
  head.material = shaft.material as StandardMaterial;
  head.rotation.z = Math.PI / 2; // point along +X
  head.position = new Vector3(length / 2 + 0.06, 0, 0);

  const merged = Mesh.MergeMeshes([shaft, head], true, true, undefined, false, true)!;
  merged.isVisible = false;
  return merged;
}

// Helpers
const colorMat = (scene: Scene, r: number, g: number, b: number): StandardMaterial => {
  // Give each color a stable, unique material name to avoid name collisions
  const rn = Math.round(r * 100);
  const gn = Math.round(g * 100);
  const bn = Math.round(b * 100);
  const name = `featureMat_${rn}_${gn}_${bn}`;
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = new Color3(r, g, b);
  m.specularColor = Color3.Black();
  return m;
};
