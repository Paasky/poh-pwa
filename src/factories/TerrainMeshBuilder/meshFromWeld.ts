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

// UV tiling scale for the terrain normal maps
const UV_SCALE = 0.25; // larger = more tiling (more detail), smaller = less tiling

// Normal map texture paths (served from /public)
const NORMAL_TEXTURES = {
  grass: "/textures/bump/grass.png",
  sand: "/textures/bump/sand.png",
  rocks: "/textures/bump/rocks.png",
  snow: "/textures/bump/snow.png",
};

// Reference terrain colors used to derive blend weights from vColor
// Picked from existing terrainColorMap keys
const REF_COLORS = {
  grass: terrainColorMap["terrainType:grass"],
  sand: terrainColorMap["terrainType:desert"],
  rocks: terrainColorMap["terrainType:rocks"],
  snow: terrainColorMap["terrainType:snow"],
};

// Bump/normal map intensity (0..1)
const NORMAL_INTENSITY = 0.5;

// Flip axes if a normal map looks inverted (rarely needed)
const INVERT_NORMAL_X = false;
const INVERT_NORMAL_Y = false;

// Lighting strength scalars (relative multipliers applied on top of Babylon light intensities)
// Tweak these to balance the custom terrain shader with the rest of the scene without
// changing global light settings in EngineService.
const DIR_LIGHT_STRENGTH = 0.6; // directional (sun) contribution multiplier
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
uniform float uUVScale;
uniform float uNormalIntensity;
uniform float uInvertX;
uniform float uInvertY;

uniform vec3 uRefGrass;
uniform vec3 uRefSand;
uniform vec3 uRefRocks;
uniform vec3 uRefSnow;

uniform vec3 uLightDir;   // world-space direction (points from light toward scene)
uniform vec3 uLightColor; // 0..1
uniform vec3 uAmbient;    // 0..1

float invdistWeight(vec3 c, vec3 ref) {
  float d = length(c - ref);
  return 1.0 / (d + 1e-4);
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
  // Derive 4 weights from vertex color vs. reference colors
  vec3 c = clamp(vColor.rgb, 0.0, 1.0);
  float wG = invdistWeight(c, uRefGrass);
  float wS = invdistWeight(c, uRefSand);
  float wR = invdistWeight(c, uRefRocks);
  float wW = invdistWeight(c, uRefSnow);
  float wSum = max(wG + wS + wR + wW, 1e-5);
  wG /= wSum; wS /= wSum; wR /= wSum; wW /= wSum;

  vec2 uv = vUV * uUVScale;
  vec3 nG = decodeNormal(texture2D(uTexGrass, uv).xyz, uInvertX, uInvertY);
  vec3 nS = decodeNormal(texture2D(uTexSand,  uv).xyz, uInvertX, uInvertY);
  vec3 nR = decodeNormal(texture2D(uTexRocks, uv).xyz, uInvertX, uInvertY);
  vec3 nW = decodeNormal(texture2D(uTexSnow,  uv).xyz, uInvertX, uInvertY);

  // Simple normalized weighted sum blending
  vec3 nTS = normalize(nG * wG + nS * wS + nR * wR + nW * wW);
  // Intensity blend toward flat normal (0,0,1)
  nTS = normalize(mix(vec3(0.0, 0.0, 1.0), nTS, clamp(uNormalIntensity, 0.0, 1.0)));

  // Transform to world space using TBN
  mat3 TBN = cotangentFrame(normalize(vNormalW), vPositionW, uv);
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
      "uUVScale",
      "uNormalIntensity",
      "uInvertX",
      "uInvertY",
      "uRefGrass",
      "uRefSand",
      "uRefRocks",
      "uRefSnow",
      "uLightDir",
      "uLightColor",
      "uAmbient",
    ],
    samplers: ["uTexGrass", "uTexSand", "uTexRocks", "uTexSnow"],
    needAlphaBlending: false,
    needAlphaTesting: false,
  });

  // Set static uniforms from config
  shader.setFloat("uUVScale", UV_SCALE);
  shader.setFloat("uNormalIntensity", NORMAL_INTENSITY);
  shader.setFloat("uInvertX", INVERT_NORMAL_X ? -1 : 1);
  shader.setFloat("uInvertY", INVERT_NORMAL_Y ? -1 : 1);

  // Reference colors from config (Color4 -> vec3)
  const refToVec3 = (c: Color4 | Color3) => new Color3((c as any).r, (c as any).g, (c as any).b);
  shader.setColor3("uRefGrass", refToVec3(REF_COLORS.grass));
  shader.setColor3("uRefSand", refToVec3(REF_COLORS.sand));
  shader.setColor3("uRefRocks", refToVec3(REF_COLORS.rocks));
  shader.setColor3("uRefSnow", refToVec3(REF_COLORS.snow));

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
