import {
  Color3,
  Color4,
  DirectionalLight,
  Effect,
  HemisphericLight,
  Mesh,
  Scene,
  ShaderMaterial,
  Texture,
  TransformNode,
  Vector3,
  VertexData,
} from "@babylonjs/core";
import type { TerrainTileBuffers } from "@/factories/TerrainMeshBuilder/_terrainMeshTypes";
import { terrainColorMap } from "@/assets/materials/terrains";

// --------------------------------------
// Tweakable config (easy to edit)
// --------------------------------------

// UV tiling scales per texture (larger = more tiling/detail)
const UV_SCALES = {
  grass: 0.1,
  sand: 0.2,
  rocks: 0.7,
  snow: 0.3,
} as const;

// Normal map texture paths (served from /public)
const NORMAL_TEXTURES = {
  grass: "/textures/bump/grass.png",
  sand: "/textures/bump/sand.png",
  rocks: "/textures/bump/rocks.png",
  snow: "/textures/bump/snow.png",
};

// Reference terrain color groups (Phase A+):
// We derive weights by measuring distance to the NEAREST color within each group.
// This fixes cases where plains/water hues were closer to 'rocks' gray.
const REF_GROUPS = {
  grass: [
    terrainColorMap["terrainType:grass"],
    terrainColorMap["terrainType:plains"],
    terrainColorMap["terrainType:tundra"],
  ],
  sand: [
    terrainColorMap["terrainType:desert"],
    terrainColorMap["terrainType:coast"],
    terrainColorMap["terrainType:sea"],
    terrainColorMap["terrainType:ocean"],
    terrainColorMap["terrainType:lake"],
    terrainColorMap["terrainType:majorRiver"],
  ],
  rocks: [terrainColorMap["terrainType:rocks"]],
  snow: [terrainColorMap["terrainType:snow"]],
} as const;

// Per-texture bump/normal intensities (0..1) and a master multiplier
const NORMAL_INTENSITIES = {
  grass: 0.3,
  sand: 0.5,
  rocks: 1,
  snow: 1,
} as const;
const NORMAL_INTENSITY_MASTER = 0.65;

// Flip axes if a normal map looks inverted (rarely needed)
const INVERT_NORMAL_X = false;
const INVERT_NORMAL_Y = false;

// Lighting strength scalars (relative multipliers applied on top of Babylon light intensities)
// Tweak these to balance the custom terrain shader with the rest of the scene without
// changing global light settings in EngineService.
const DIR_LIGHT_STRENGTH = 1; // directional (sun) contribution multiplier
const AMBIENT_STRENGTH = 0.25; // hemispheric (ambient) contribution multiplier

// Simple ambient light fallback (used if no hemispheric light found)
const AMBIENT_FALLBACK = new Color3(0.15, 0.15, 0.18);

// Simple directional light fallback (used if no directional light found)
const DIRECTIONAL_COLOR_FALLBACK = new Color3(1, 1, 1);
const DIRECTIONAL_DIR_FALLBACK = new Vector3(0.3, -1.0, 0.2).normalize();

// --------------------------------------
// Shader sources (inline)
// --------------------------------------

const SHADER_BASE = "terrainNormalBlend";

Effect.ShadersStore[`${SHADER_BASE}VertexShader`] = /* glsl */ `
precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec4 color;

// Varyings
varying vec2 vUV;
varying vec4 vColor;
varying vec3 vPositionW;
varying vec3 vNormalW;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;

void main() {
  vec4 worldPos = world * vec4(position, 1.0);
  vPositionW = worldPos.xyz;
  vNormalW = normalize((world * vec4(normal, 0.0)).xyz);
  vUV = uv;
  vColor = color;
  gl_Position = worldViewProjection * vec4(position, 1.0);
} 
`;

Effect.ShadersStore[`${SHADER_BASE}FragmentShader`] = /* glsl */ `
precision highp float;
#extension GL_OES_standard_derivatives : enable

varying vec2 vUV;
varying vec4 vColor;
varying vec3 vPositionW;
varying vec3 vNormalW;

// Samplers
uniform sampler2D uTexGrass;
uniform sampler2D uTexSand;
uniform sampler2D uTexRocks;
uniform sampler2D uTexSnow;

// Uniforms
uniform float uUVScaleGrass;
uniform float uUVScaleSand;
uniform float uUVScaleRocks;
uniform float uUVScaleSnow;
uniform float uIntMaster;
uniform float uInvertX;
uniform float uInvertY;

// Per-texture intensities
uniform float uIntGrass;
uniform float uIntSand;
uniform float uIntRocks;
uniform float uIntSnow;

// Reference color groups (fixed counts)
uniform vec3 uRefGrassA;
uniform vec3 uRefGrassB;
uniform vec3 uRefGrassC;

uniform vec3 uRefSandA;
uniform vec3 uRefSandB;
uniform vec3 uRefSandC;
uniform vec3 uRefSandD;
uniform vec3 uRefSandE;
uniform vec3 uRefSandF;

uniform vec3 uRefRocksA;
uniform vec3 uRefSnowA;

uniform vec3 uLightDir;   // world-space direction (points from light toward scene)
uniform vec3 uLightColor; // 0..1
uniform vec3 uAmbient;    // 0..1

float invdistWeight(vec3 c, vec3 ref) {
  float d = length(c - ref);
  return 1.0 / (d + 1e-4);
}

float invdistFromMin3(vec3 c, vec3 a, vec3 b, vec3 d2) {
  float dA = length(c - a);
  float dB = length(c - b);
  float dC = length(c - d2);
  float dMin = min(dA, min(dB, dC));
  return 1.0 / (dMin + 1e-4);
}

float invdistFromMin6(
  vec3 c,
  vec3 a, vec3 b, vec3 d2,
  vec3 e, vec3 f, vec3 g
) {
  float dA = length(c - a);
  float dB = length(c - b);
  float dC = length(c - d2);
  float dE = length(c - e);
  float dF = length(c - f);
  float dG = length(c - g);
  float dMin = min(min(dA, dB), min(min(dC, dE), min(dF, dG)));
  return 1.0 / (dMin + 1e-4);
}

vec3 decodeNormal(vec3 rgb, float invX, float invY) {
  vec3 n = rgb * 2.0 - 1.0;
  n.x *= invX;
  n.y *= invY;
  // Z stays as-is
  return normalize(n);
}

// Build TBN from derivatives (no tangent attribute needed)
mat3 cotangentFrame(vec3 N, vec3 pos, vec2 uv) {
  vec3 dp1 = dFdx(pos);
  vec3 dp2 = dFdy(pos);
  vec2 duv1 = dFdx(uv);
  vec2 duv2 = dFdy(uv);

  vec3 T = normalize(dp1 * duv2.y - dp2 * duv1.y);
  vec3 B = normalize(-dp1 * duv2.x + dp2 * duv1.x);
  return mat3(T, B, normalize(N));
}

void main() {
  // Derive 4 weights from vertex color vs. grouped reference colors (min-distance per group)
  vec3 c = clamp(vColor.rgb, 0.0, 1.0);
  float wG = invdistFromMin3(c, uRefGrassA, uRefGrassB, uRefGrassC);
  float wS = invdistFromMin6(c, uRefSandA, uRefSandB, uRefSandC, uRefSandD, uRefSandE, uRefSandF);
  float wR = invdistWeight(c, uRefRocksA);
  float wW = invdistWeight(c, uRefSnowA);
  float wSum = max(wG + wS + wR + wW, 1e-5);
  wG /= wSum; wS /= wSum; wR /= wSum; wW /= wSum;

  vec2 uvG = vUV * uUVScaleGrass;
  vec2 uvS = vUV * uUVScaleSand;
  vec2 uvR = vUV * uUVScaleRocks;
  vec2 uvW = vUV * uUVScaleSnow;
  vec3 nG = decodeNormal(texture2D(uTexGrass, uvG).xyz, uInvertX, uInvertY);
  vec3 nS = decodeNormal(texture2D(uTexSand,  uvS).xyz, uInvertX, uInvertY);
  vec3 nR = decodeNormal(texture2D(uTexRocks, uvR).xyz, uInvertX, uInvertY);
  vec3 nW = decodeNormal(texture2D(uTexSnow,  uvW).xyz, uInvertX, uInvertY);

  // Apply per-texture intensity toward flat normal
  nG = normalize(mix(vec3(0.0, 0.0, 1.0), nG, clamp(uIntGrass, 0.0, 1.0)));
  nS = normalize(mix(vec3(0.0, 0.0, 1.0), nS, clamp(uIntSand, 0.0, 1.0)));
  nR = normalize(mix(vec3(0.0, 0.0, 1.0), nR, clamp(uIntRocks, 0.0, 1.0)));
  nW = normalize(mix(vec3(0.0, 0.0, 1.0), nW, clamp(uIntSnow, 0.0, 1.0)));

  // Simple normalized weighted sum blending
  vec3 nTS = normalize(nG * wG + nS * wS + nR * wR + nW * wW);
  // Intensity blend toward flat normal (0,0,1)
  nTS = normalize(mix(vec3(0.0, 0.0, 1.0), nTS, clamp(uIntMaster, 0.0, 1.0)));

  // Transform to world space using TBN
  mat3 TBN = cotangentFrame(normalize(vNormalW), vPositionW, vUV);
  vec3 nWld = normalize(TBN * nTS);

  // Lighting (Lambert + ambient)
  vec3 L = normalize(-uLightDir); // directional light vector from point to light
  float NdotL = max(dot(nWld, L), 0.0);
  vec3 baseCol = c; // keep current vertex color as diffuse base
  vec3 lit = baseCol * (uLightColor * NdotL) + baseCol * uAmbient;

  gl_FragColor = vec4(clamp(lit, 0.0, 1.0), 1.0);
}
`;

export function meshFromWeld(
  scene: Scene,
  parent: TransformNode,
  welded: TerrainTileBuffers,
): Mesh {
  // --- Build geometry
  const mesh = new Mesh("terrain.tiles", scene);
  const vd = new VertexData();
  vd.positions = welded.positions;
  vd.indices = welded.indices;
  vd.colors = welded.colors;

  // Generate simple planar UVs (XZ projection)
  const uvs: number[] = [];
  if (welded.positions.length) {
    for (let i = 0; i < welded.positions.length; i += 3) {
      const x = welded.positions[i + 0];
      const z = welded.positions[i + 2];
      uvs.push(x, z); // scale applied in shader via uUVScale
    }
  }
  vd.uvs = uvs;

  const normals: number[] = [];
  if (welded.positions.length && welded.indices.length) {
    VertexData.ComputeNormals(welded.positions, welded.indices, normals);
  }
  vd.normals = normals;
  vd.applyToMesh(mesh, true);

  // --- Material: custom shader blending 4 normal maps
  const shader = new ShaderMaterial("mat.terrain.blendNormals", scene, SHADER_BASE, {
    attributes: ["position", "normal", "uv", "color"],
    uniforms: [
      "world",
      "worldViewProjection",
      "uUVScaleGrass",
      "uUVScaleSand",
      "uUVScaleRocks",
      "uUVScaleSnow",
      "uIntMaster",
      "uInvertX",
      "uInvertY",
      "uIntGrass",
      "uIntSand",
      "uIntRocks",
      "uIntSnow",
      "uRefGrassA",
      "uRefGrassB",
      "uRefGrassC",
      "uRefSandA",
      "uRefSandB",
      "uRefSandC",
      "uRefSandD",
      "uRefSandE",
      "uRefSandF",
      "uRefRocksA",
      "uRefSnowA",
      "uLightDir",
      "uLightColor",
      "uAmbient",
    ],
    samplers: ["uTexGrass", "uTexSand", "uTexRocks", "uTexSnow"],
    needAlphaBlending: false,
    needAlphaTesting: false,
  });

  // Set static uniforms from config
  shader.setFloat("uUVScaleGrass", UV_SCALES.grass);
  shader.setFloat("uUVScaleSand", UV_SCALES.sand);
  shader.setFloat("uUVScaleRocks", UV_SCALES.rocks);
  shader.setFloat("uUVScaleSnow", UV_SCALES.snow);
  shader.setFloat("uIntMaster", NORMAL_INTENSITY_MASTER);
  shader.setFloat("uInvertX", INVERT_NORMAL_X ? -1 : 1);
  shader.setFloat("uInvertY", INVERT_NORMAL_Y ? -1 : 1);
  shader.setFloat("uIntGrass", NORMAL_INTENSITIES.grass);
  shader.setFloat("uIntSand", NORMAL_INTENSITIES.sand);
  shader.setFloat("uIntRocks", NORMAL_INTENSITIES.rocks);
  shader.setFloat("uIntSnow", NORMAL_INTENSITIES.snow);

  // Reference colors from config (Color4 -> vec3)
  const refToVec3 = (c: Color4 | Color3) => new Color3((c as any).r, (c as any).g, (c as any).b);
  // Grass group (3)
  shader.setColor3("uRefGrassA", refToVec3(REF_GROUPS.grass[0]));
  shader.setColor3("uRefGrassB", refToVec3(REF_GROUPS.grass[1]));
  shader.setColor3("uRefGrassC", refToVec3(REF_GROUPS.grass[2]));
  // Sand group (6)
  shader.setColor3("uRefSandA", refToVec3(REF_GROUPS.sand[0]));
  shader.setColor3("uRefSandB", refToVec3(REF_GROUPS.sand[1]));
  shader.setColor3("uRefSandC", refToVec3(REF_GROUPS.sand[2]));
  shader.setColor3("uRefSandD", refToVec3(REF_GROUPS.sand[3]));
  shader.setColor3("uRefSandE", refToVec3(REF_GROUPS.sand[4]));
  shader.setColor3("uRefSandF", refToVec3(REF_GROUPS.sand[5]));
  // Rocks (1), Snow (1)
  shader.setColor3("uRefRocksA", refToVec3(REF_GROUPS.rocks[0]));
  shader.setColor3("uRefSnowA", refToVec3(REF_GROUPS.snow[0]));

  // Textures (normal maps)
  const texGrass = new Texture(
    NORMAL_TEXTURES.grass,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
  );
  const texSand = new Texture(
    NORMAL_TEXTURES.sand,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
  );
  const texRocks = new Texture(
    NORMAL_TEXTURES.rocks,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
  );
  const texSnow = new Texture(
    NORMAL_TEXTURES.snow,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
  );
  shader.setTexture("uTexGrass", texGrass);
  shader.setTexture("uTexSand", texSand);
  shader.setTexture("uTexRocks", texRocks);
  shader.setTexture("uTexSnow", texSnow);

  // Bind dynamic lighting uniforms each frame
  shader.onBind = () => {
    // Ambient from hemispheric light if present
    const hemi = scene.lights.find((l) => l.getClassName() === "HemisphericLight") as
      | HemisphericLight
      | undefined;
    const ambient = hemi
      ? hemi.diffuse.clone().scale(hemi.intensity * AMBIENT_STRENGTH)
      : AMBIENT_FALLBACK.scale(AMBIENT_STRENGTH);
    shader.setColor3("uAmbient", ambient);

    // Directional light (use first one found)
    const dir = scene.lights.find((l) => l.getClassName() === "DirectionalLight") as
      | DirectionalLight
      | undefined;
    const lightDir = dir ? dir.direction : DIRECTIONAL_DIR_FALLBACK;
    const lightColor = dir
      ? (dir.diffuse ?? DIRECTIONAL_COLOR_FALLBACK)
          .clone()
          .scale(dir.intensity * DIR_LIGHT_STRENGTH)
      : DIRECTIONAL_COLOR_FALLBACK.scale(DIR_LIGHT_STRENGTH);
    shader.setVector3("uLightDir", lightDir);
    shader.setColor3("uLightColor", lightColor);
  };

  mesh.material = shader;
  mesh.parent = parent;

  return mesh;
}
