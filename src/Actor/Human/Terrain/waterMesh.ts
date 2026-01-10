import { asColor3, terrainColorMap } from "@/Actor/Human/Assets/materials/terrains";
import { getWorldDepth, getWorldWidth, wrapExclusive } from "@/Common/Helpers/math";
import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  TransformNode,
} from "@babylonjs/core";

import { Coords, waterLevel } from "@/Common/Helpers/mapTools";

export type WaterMeshHandle = {
  mesh: Mesh;
  dispose: () => void;
};

export function createWaterMesh(
  scene: Scene,
  size: Coords,
  parent?: TransformNode,
): WaterMeshHandle {
  // TUNING KNOBS (easy to tweak).
  // These control the look/feel of the water sparkles without hunting through the code.
  //
  // General texture/tiling
  const textureSizePx = 1024; // Bigger = crisper sparkles, but more CPU when redrawing
  const redrawIntervalMs = 120; // How often the sparkle texture updates (lower = smoother, higher = cheaper)
  const tilesScaleMultiplier = 20; // How densely the emissive texture tiles across the water plane (higher = denser pattern)

  // Emissive UV movement on the material (global drift + subtle S-shaped weave)
  const uvDriftSpeedU = 0.1; // base drift speed along U (texture X), higher = faster sideways motion
  const uvDriftSpeedV = 0.05; // base drift speed along V (texture Y), higher = faster forward/back motion
  const uvWeaveAmp = 0.05; // amplitude of the S-shaped weave added to the drift (subtle wobble)
  const uvWeaveUFreq1 = 0.6,
    uvWeaveUFreq2 = 0.17; // weave frequencies for U
  const uvWeaveVFreq1 = 0.8,
    uvWeaveVFreq2 = 0.21; // weave frequencies for V

  // Overall brightness of the sparkles (multiplies the global pulse)
  const globalBrightnessMultiplier = 3.0; // raise for punchier peak glints, lower if too bright
  const globalPulseFreqA = 1.6; // Hz for the main brightness pulse component
  const globalPulseFreqB = 3.1; // Hz for a faster sparkle component
  const globalPulsePhaseB = 1.4; // phase offset for the faster component
  const globalPulseCeil = 1.25; // clamp of the combined pulse before applying the multiplier
  const globalPulseMinPercent = 0.5; // 0..1 floor for the global pulse (0.5 = 50% min brightness)

  // Layer orientation and world-scale separation
  // Base rotation for each sparkle layer to avoid visible # grid alignment.
  // Default: 0°, 120°, 240°.
  const layerBaseAnglesDeg = [0, 120, 240];
  // Per-layer dot radius multipliers to enforce distinct world-scales
  // (one roughly current, one larger dots, one smaller dots)
  const layerRadiusScale = [1.0, 1.35, 0.75];
  // Per-layer pattern spacing multipliers (affects perceived density/scale)
  const layerPatternScaleMultiplier = [1.0, 1.15, 0.9];

  // Dynamic retiming of animation per-layer
  // Every 1–3 seconds, each layer will re-roll a time scale between 0.5× and 2×,
  // which changes how quickly its drift/rotation/wobble/pulse advance.
  const retimeIntervalSecMin = 1.0;
  const retimeIntervalSecMax = 3.0;
  const timeScaleMin = 0.5;
  const timeScaleMax = 2.0;

  // Multi-layer sparkle field (Approach A): 3 independent layers with different speeds/scales/directions.
  // Provide MIN/MAX ranges; each layer will randomize within these ranges on start to avoid lockstep motion.
  const layersConfig = [
    {
      // Slow, broad glints
      dotCount: { min: 50, max: 70 },
      radiusPercent: { min: 0.006, max: 0.012 }, // of texture size
      alpha: { min: 0.12, max: 0.28 },
      patternScale: { min: 0.8, max: 1.1 }, // 1 = no scale; >1 spreads pattern, <1 concentrates it
      driftCPM: { min: 0.15, max: 0.35 }, // cycles per minute the pattern drifts across the texture
      rotationDPM: { min: -15, max: -5 }, // degrees per minute (negative = clockwise)
      wobbleAmpPercent: { min: 0.01, max: 0.02 }, // extra weave in pixels as % of texture size
      wobbleFreq1: { min: 0.08, max: 0.18 },
      wobbleFreq2: { min: 0.18, max: 0.3 },
      pulseHz: { min: 0.2, max: 0.4 },
      grid: { gx: 4, gy: 4, ampRange: { min: 0.6, max: 1.2 }, freqRange: { min: 0.15, max: 0.5 } },
    },
    {
      // Medium layer
      dotCount: { min: 70, max: 90 },
      radiusPercent: { min: 0.0025, max: 0.008 },
      alpha: { min: 0.1, max: 0.26 },
      patternScale: { min: 0.9, max: 1.3 },
      driftCPM: { min: 0.45, max: 0.8 },
      rotationDPM: { min: 10, max: 22 },
      wobbleAmpPercent: { min: 0.015, max: 0.028 },
      wobbleFreq1: { min: 0.12, max: 0.24 },
      wobbleFreq2: { min: 0.2, max: 0.36 },
      pulseHz: { min: 0.4, max: 0.9 },
      grid: { gx: 6, gy: 6, ampRange: { min: 0.6, max: 1.2 }, freqRange: { min: 0.2, max: 0.7 } },
    },
    {
      // Fast, fine twinkles
      dotCount: { min: 90, max: 110 },
      radiusPercent: { min: 0.0015, max: 0.005 },
      alpha: { min: 0.08, max: 0.22 },
      patternScale: { min: 0.9, max: 1.4 },
      driftCPM: { min: 0.9, max: 1.3 },
      rotationDPM: { min: 2, max: 8 },
      wobbleAmpPercent: { min: 0.018, max: 0.032 },
      wobbleFreq1: { min: 0.2, max: 0.36 },
      wobbleFreq2: { min: 0.28, max: 0.48 },
      pulseHz: { min: 0.8, max: 1.6 },
      grid: { gx: 8, gy: 8, ampRange: { min: 0.6, max: 1.2 }, freqRange: { min: 0.25, max: 0.9 } },
    },
  ];

  const worldWidth = getWorldWidth(size.x);
  const worldDepth = getWorldDepth(size.y);

  const waterPlane = MeshBuilder.CreateGround(
    "terrain.water.plane",
    { width: worldWidth, height: worldDepth, subdivisions: 1 },
    scene,
  );
  if (parent) waterPlane.parent = parent;
  waterPlane.position.y = waterLevel;

  const matWater = new StandardMaterial("terrainMat.water.plane", scene);
  matWater.diffuseColor = asColor3(terrainColorMap["terrainType:ocean"]);
  matWater.specularColor = new Color3(0.85, 0.9, 1);
  matWater.specularPower = 128;
  matWater.alpha = 0.55; // slight transparency

  // Procedural dynamic textures for sparkles
  // Approach A: one DynamicTexture that composites 3 independent sparkle layers additively.
  const sparkleField = createMultiSparkleField(scene, {
    size: textureSizePx,
    redrawIntervalMs,
    layers: layersConfig,
    baseAnglesDeg: layerBaseAnglesDeg,
    radiusScaleByLayer: layerRadiusScale,
    patternScaleMulByLayer: layerPatternScaleMultiplier,
    timeScaleRange: { min: timeScaleMin, max: timeScaleMax },
    retimeIntervalSec: { min: retimeIntervalSecMin, max: retimeIntervalSecMax },
  });

  // Subtle emissive sparkles that shimmer on top
  matWater.emissiveColor = new Color3(0.1, 0.12, 0.15);
  matWater.emissiveTexture = sparkleField.texture;
  (matWater.emissiveTexture as Texture).wrapU = Texture.WRAP_ADDRESSMODE;
  (matWater.emissiveTexture as Texture).wrapV = Texture.WRAP_ADDRESSMODE;

  // Tile textures across the plane
  const tilesX = Math.max(8, Math.round(worldWidth / 100));
  const tilesY = Math.max(8, Math.round(worldDepth / 100));
  (matWater.emissiveTexture as Texture).uScale = tilesX * tilesScaleMultiplier;
  (matWater.emissiveTexture as Texture).vScale = tilesY * tilesScaleMultiplier;

  waterPlane.material = matWater;

  // Animate UV offsets to fake water movement and sparkling
  const startT = performance.now();
  const beforeRender = () => {
    // Time Helpers
    const now = performance.now();
    const dt = (now - startT) / 100000; // legacy scaling for offsets
    const tSec = (now - startT) / 1000; // seconds for pulsation
    // Update animated regional brightness (few times per second for perf)
    sparkleField.update(tSec);
    const emisTex = matWater.emissiveTexture as Texture | null;
    if (emisTex) {
      // Global drift with subtle S-shaped weave (perceived odd motion)
      const uWeave =
        uvWeaveAmp * Math.sin(tSec * uvWeaveUFreq1) * Math.sin(tSec * uvWeaveUFreq2 + 1.3);
      const vWeave =
        uvWeaveAmp * Math.sin(tSec * uvWeaveVFreq1 + 0.5) * Math.sin(tSec * uvWeaveVFreq2 + 2.1);
      emisTex.uOffset = (dt * uvDriftSpeedU + uWeave) % 1;
      emisTex.vOffset = (dt * uvDriftSpeedV + vWeave) % 1;

      // Global emissive pulse: remap from 0–100% to min%–100% to avoid going too dim
      const pulseRaw =
        0.5 +
        0.5 * Math.sin(tSec * globalPulseFreqA) +
        0.3 * Math.sin(tSec * globalPulseFreqB + globalPulsePhaseB);
      // Clamp to ceiling, normalize, then remap to [globalPulseMinPercent, 1]
      const pulseClamped = Math.max(0, Math.min(globalPulseCeil, pulseRaw));
      const pulseNorm = globalPulseCeil > 0 ? pulseClamped / globalPulseCeil : 0; // 0..1
      const pulseRemapped =
        globalPulseCeil * (globalPulseMinPercent + (1 - globalPulseMinPercent) * pulseNorm);
      (emisTex as Texture).level = pulseRemapped * globalBrightnessMultiplier;
    }
  };
  scene.registerBeforeRender(beforeRender);

  const dispose = () => {
    scene.unregisterBeforeRender(beforeRender);
    sparkleField.dispose();
    waterPlane.dispose();
  };

  return { mesh: waterPlane, dispose };
}

// Multi-layer sparkle field (single DynamicTexture) with per-section animated brightness.
// Multiple independent layers are additively blended to sell perceived randomness.
type SparkleField = {
  texture: DynamicTexture;
  update: (tSec: number) => void;
  dispose: () => void;
};

type Range = { min: number; max: number };
type LayerRangeCfg = {
  dotCount: Range;
  radiusPercent: Range; // of texture size
  alpha: Range;
  patternScale: Range;
  driftCPM: Range; // cycles per minute across the texture
  rotationDPM: Range; // degrees per minute
  wobbleAmpPercent: Range; // as % of texture size
  wobbleFreq1: Range; // Hz-ish, used in sin blend
  wobbleFreq2: Range;
  pulseHz: Range;
  grid: { gx: number; gy: number; ampRange: Range; freqRange: Range };
};

type MultiFieldConfig = {
  size: number;
  redrawIntervalMs: number;
  layers: LayerRangeCfg[];
  // Optional per-layer controls
  baseAnglesDeg?: number[]; // base orientation per layer in degrees (e.g., [0,120,240])
  radiusScaleByLayer?: number[]; // multiply dot radii per layer for world-scale separation
  patternScaleMulByLayer?: number[]; // multiply patternScale per layer for spacing differences
  timeScaleRange?: Range; // per-layer animation time scaling (e.g., 0.5..2)
  retimeIntervalSec?: Range; // how often a layer re-rolls its time scale (e.g., 1..3 s)
};

function createMultiSparkleField(scene: Scene, cfg: MultiFieldConfig): SparkleField {
  const size = cfg.size;
  const tex = new DynamicTexture(
    "water.sparkle.multi",
    { width: size, height: size },
    scene,
    false,
  );
  const ctx = tex.getContext() as CanvasRenderingContext2D;

  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  const irand = (min: number, max: number) => Math.round(rand(min, max));
  const TAU = Math.PI * 2;
  const DEG2RAD = Math.PI / 180;

  type Dot = { x: number; y: number; r: number; a: number };
  type Layer = {
    dots: Dot[];
    patternScale: number;
    driftCPM: number;
    driftDir: { x: number; y: number };
    rotationDPM: number;
    baseAngleRad: number;
    wobbleAmpPx: number;
    wobbleF1: number;
    wobbleF2: number;
    wobblePhi1: number;
    wobblePhi2: number;
    pulseHz: number;
    pulsePhi: number;
    // Local time scaling & retiming
    tLocal: number;
    timeScale: number;
    timeToNextRetimeSec: number;
    grid: {
      gx: number;
      gy: number;
      cellW: number;
      cellH: number;
      phase: number[][];
      freq: number[][];
      amp: number[][];
    };
  };

  function makeGrid(gx: number, gy: number, ampRange: Range, freqRange: Range) {
    const cellW = size / gx;
    const cellH = size / gy;
    const phase: number[][] = [];
    const freq: number[][] = [];
    const amp: number[][] = [];
    for (let y = 0; y < gy; y++) {
      phase[y] = [];
      freq[y] = [];
      amp[y] = [];
      for (let x = 0; x < gx; x++) {
        phase[y][x] = Math.random() * TAU;
        freq[y][x] = rand(freqRange.min, freqRange.max);
        amp[y][x] = rand(ampRange.min, ampRange.max);
      }
    }
    return { gx, gy, cellW, cellH, phase, freq, amp };
  }

  const timeScaleMin = cfg.timeScaleRange?.min ?? 0.5;
  const timeScaleMax = cfg.timeScaleRange?.max ?? 2.0;
  const retimeMin = cfg.retimeIntervalSec?.min ?? 1.0;
  const retimeMax = cfg.retimeIntervalSec?.max ?? 3.0;

  const layers: Layer[] = cfg.layers.map((lr, idx) => {
    const count = irand(lr.dotCount.min, lr.dotCount.max);
    const dots: Dot[] = new Array(count);
    const radiusScale = cfg.radiusScaleByLayer?.[idx] ?? 1.0;
    for (let i = 0; i < count; i++) {
      dots[i] = {
        x: Math.random() * size,
        y: Math.random() * size,
        r: size * rand(lr.radiusPercent.min, lr.radiusPercent.max) * radiusScale,
        a: rand(lr.alpha.min, lr.alpha.max),
      };
    }
    const driftDirAngle = Math.random() * TAU;
    const patternScale =
      rand(lr.patternScale.min, lr.patternScale.max) * (cfg.patternScaleMulByLayer?.[idx] ?? 1.0);
    const driftCPM = rand(lr.driftCPM.min, lr.driftCPM.max);
    const rotationDPM = rand(lr.rotationDPM.min, lr.rotationDPM.max);
    const baseAngleRad = ((cfg.baseAnglesDeg?.[idx] ?? (idx * 120) % 360) * DEG2RAD) as number;
    const wobbleAmpPx = size * rand(lr.wobbleAmpPercent.min, lr.wobbleAmpPercent.max);
    const wobbleF1 = rand(lr.wobbleFreq1.min, lr.wobbleFreq1.max);
    const wobbleF2 = rand(lr.wobbleFreq2.min, lr.wobbleFreq2.max);
    const wobblePhi1 = Math.random() * TAU;
    const wobblePhi2 = Math.random() * TAU;
    const pulseHz = rand(lr.pulseHz.min, lr.pulseHz.max);
    const pulsePhi = Math.random() * TAU;
    const grid = makeGrid(lr.grid.gx, lr.grid.gy, lr.grid.ampRange, lr.grid.freqRange);
    return {
      dots,
      patternScale,
      driftCPM,
      driftDir: { x: Math.cos(driftDirAngle), y: Math.sin(driftDirAngle) },
      rotationDPM,
      baseAngleRad,
      wobbleAmpPx,
      wobbleF1,
      wobbleF2,
      wobblePhi1,
      wobblePhi2,
      pulseHz,
      pulsePhi,
      tLocal: 0,
      timeScale: rand(timeScaleMin, timeScaleMax),
      timeToNextRetimeSec: rand(retimeMin, retimeMax),
      grid,
    };
  });

  let lastRedraw = -1;
  let lastGlobalTSec = 0;

  function clear() {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, size, size);
  }

  function wrapPositions(base: [number, number], r: number): [number, number][] {
    const [tx, ty] = base;
    const positions: [number, number][] = [[tx, ty]];
    if (tx - r < 0) positions.push([tx + size, ty]);
    if (tx + r > size) positions.push([tx - size, ty]);
    const len = positions.length;
    for (let i = 0; i < len; i++) {
      const [px, py] = positions[i];
      if (py - r < 0) positions.push([px, py + size]);
      if (py + r > size) positions.push([px, py - size]);
    }
    return positions;
  }

  function drawLayer(layer: Layer, tSec: number) {
    const cx = size * 0.5;
    const cy = size * 0.5;
    // Compute transforms for this layer
    const angle = layer.baseAngleRad + ((layer.rotationDPM * tSec) / 60) * DEG2RAD;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const driftPixels = layer.driftCPM * size * (tSec / 60);
    const offX =
      driftPixels * layer.driftDir.x +
      layer.wobbleAmpPx *
        Math.sin(tSec * layer.wobbleF1 + layer.wobblePhi1) *
        Math.sin(tSec * layer.wobbleF2 + layer.wobblePhi2);
    const offY =
      driftPixels * layer.driftDir.y +
      layer.wobbleAmpPx *
        Math.sin(tSec * (layer.wobbleF1 * 0.87) + layer.wobblePhi1 + 0.7) *
        Math.sin(tSec * (layer.wobbleF2 * 1.14) + layer.wobblePhi2 + 1.1);
    const pulse = 0.35 + 0.85 * Math.abs(Math.sin(TAU * layer.pulseHz * tSec + layer.pulsePhi)); // ~0.35..1.2

    const { gx, gy, cellW, cellH, phase, freq, amp } = layer.grid;

    for (const d of layer.dots) {
      // Scale around center, then rotate, then translate by offset
      const dx = (d.x - cx) * layer.patternScale;
      const dy = (d.y - cy) * layer.patternScale;
      const rx = dx * cosA - dy * sinA;
      const ry = dx * sinA + dy * cosA;
      const tx = cx + rx + offX;
      const ty = cy + ry + offY;

      const positions = wrapPositions([tx, ty], d.r);
      for (const [px, py] of positions) {
        // Region modulation based on transformed position
        const cxIdx = Math.max(0, Math.min(gx - 1, Math.floor(wrapExclusive(px, 0, size) / cellW)));
        const cyIdx = Math.max(0, Math.min(gy - 1, Math.floor(wrapExclusive(py, 0, size) / cellH)));
        const f =
          0.3 +
          Math.abs(Math.sin(tSec * freq[cyIdx][cxIdx] + phase[cyIdx][cxIdx])) *
            ((1.9 * amp[cyIdx][cxIdx]) / 1.8);
        const a0 = d.a * pulse * f;
        const g = ctx.createRadialGradient(px, py, 0, px, py, d.r);
        g.addColorStop(0, `rgba(255,255,255,${a0})`);
        g.addColorStop(0.4, `rgba(255,255,255,${a0 * 0.6})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function draw() {
    clear();
    ctx.globalCompositeOperation = "lighter"; // additive between layers
    for (const layer of layers) drawLayer(layer, layer.tLocal);
    tex.update(false);
  }

  // Initial draw
  draw();

  return {
    texture: tex,
    update: (tSec: number) => {
      const now = performance.now();
      if (lastRedraw < 0 || now - lastRedraw > cfg.redrawIntervalMs) {
        // Advance local times with dynamic per-layer scaling
        const deltaGlobal = lastRedraw < 0 ? 0 : tSec - lastGlobalTSec;
        for (const layer of layers) {
          // retime countdown in global seconds
          layer.timeToNextRetimeSec -= deltaGlobal;
          if (layer.timeToNextRetimeSec <= 0) {
            layer.timeScale = rand(timeScaleMin, timeScaleMax);
            layer.timeToNextRetimeSec = rand(retimeMin, retimeMax);
          }
          layer.tLocal += Math.max(0, deltaGlobal) * layer.timeScale;
        }

        draw();
        lastRedraw = now;
        lastGlobalTSec = tSec;
      }
    },
    dispose: () => tex.dispose(),
  };
}
