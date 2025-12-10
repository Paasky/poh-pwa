import { asColor3, terrainColorMap } from '@/assets/materials/terrains'
import { getWorldDepth, getWorldWidth } from '@/helpers/math'
import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  TransformNode,
} from '@babylonjs/core'

import type { Coords } from '@/helpers/mapTools'

export type WaterMeshHandle = {
  mesh: Mesh
  dispose: () => void
}

export function createWaterMesh (
  scene: Scene,
  size: Coords,
  parent?: TransformNode,
): WaterMeshHandle {
  const worldWidth = getWorldWidth(size.x)
  const worldDepth = getWorldDepth(size.y)

  const waterPlane = MeshBuilder.CreateGround(
    'terrain.water.plane',
    { width: worldWidth, height: worldDepth, subdivisions: 1 },
    scene,
  )
  if (parent) waterPlane.parent = parent
  // Place between ground (0) and coast floor (-0.4)
  waterPlane.position.y = -0.2

  const matWater = new StandardMaterial('terrainMat.water.plane', scene)
  matWater.diffuseColor = asColor3(terrainColorMap['terrainType:ocean'])
  matWater.specularColor = new Color3(0.85, 0.9, 1)
  matWater.specularPower = 128
  matWater.alpha = 0.55 // slight transparency

  // Procedural dynamic textures for simple waves and sparkles
  const wavesTex = createWavesTexture(scene, 512)
  const sparkleTex = createSparkleTexture(scene, 512)

  // Apply textures
  matWater.diffuseTexture = wavesTex
  matWater.diffuseTexture.hasAlpha = true
  ;(matWater.diffuseTexture as Texture).wrapU = Texture.WRAP_ADDRESSMODE
  ;(matWater.diffuseTexture as Texture).wrapV = Texture.WRAP_ADDRESSMODE

  // Subtle emissive sparkles that shimmer on top
  matWater.emissiveColor = new Color3(0.1, 0.12, 0.15)
  matWater.emissiveTexture = sparkleTex
  ;(matWater.emissiveTexture as Texture).wrapU = Texture.WRAP_ADDRESSMODE
  ;(matWater.emissiveTexture as Texture).wrapV = Texture.WRAP_ADDRESSMODE

  // Tile textures across the plane
  const tilesX = Math.max(8, Math.round(worldWidth / 200))
  const tilesY = Math.max(8, Math.round(worldDepth / 200))
  ;(matWater.diffuseTexture as Texture).uScale = tilesX
  ;(matWater.diffuseTexture as Texture).vScale = tilesY
  ;(matWater.emissiveTexture as Texture).uScale = tilesX * 1.2
  ;(matWater.emissiveTexture as Texture).vScale = tilesY * 1.2

  waterPlane.material = matWater

  // Animate UV offsets to fake water movement and sparkling
  const startT = performance.now()
  const beforeRender = () => {
    const dt = (performance.now() - startT) / 1000
    const diffTex = matWater.diffuseTexture as Texture | null
    const emisTex = matWater.emissiveTexture as Texture | null
    if (diffTex) {
      diffTex.uOffset = (dt * 0.02) % 1
      diffTex.vOffset = (dt * 0.01) % 1
    }
    if (emisTex) {
      emisTex.uOffset = (dt * 0.07) % 1
      emisTex.vOffset = (dt * 0.05) % 1
    }
  }
  scene.registerBeforeRender(beforeRender)

  const dispose = () => {
    scene.unregisterBeforeRender(beforeRender)
    wavesTex.dispose()
    sparkleTex.dispose()
    waterPlane.dispose()
  }

  return { mesh: waterPlane, dispose }
}

// Create a semi-transparent diagonal wave stripe texture
function createWavesTexture (scene: Scene, size: number = 512): DynamicTexture {
  const tex = new DynamicTexture('water.waves.tex', { width: size, height: size }, scene, false)
  const ctx = tex.getContext() as CanvasRenderingContext2D
  // Clear transparent
  ctx.clearRect(0, 0, size, size)

  // Draw multiple diagonal soft stripes
  const stripeCount = 20
  for (let i = -2; i < stripeCount + 2; i++) {
    const x = (i / stripeCount) * size
    ctx.save()
    ctx.translate(x, 0)
    ctx.rotate(-Math.PI / 6)
    const grad = ctx.createLinearGradient(0, -size, 0, size)
    const alpha = 0.06
    grad.addColorStop(0, `rgba(255, 255, 255, 0)`)
    grad.addColorStop(0.5, `rgba(255,255,255,${alpha})`)
    grad.addColorStop(1, `rgba(255, 255, 255, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(-size, -size, size * 3, size * 2)
    ctx.restore()
  }

  // Slight circular soft spots to break uniformity
  for (let i = 0; i < 6; i++) {
    const r = size * (0.04 + Math.random() * 0.06)
    const cx = Math.random() * size
    const cy = Math.random() * size
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(255,255,255,0.07)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  tex.update(false)
  tex.hasAlpha = true
  return tex
}

// Create small bright dots on black background for emissive sparkles
function createSparkleTexture (scene: Scene, size: number = 512): DynamicTexture {
  const tex = new DynamicTexture('water.sparkle.tex', { width: size, height: size }, scene, false)
  const ctx = tex.getContext() as CanvasRenderingContext2D
  // Black base (no emission) with transparent edges handled via emissive only
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.fillRect(0, 0, size, size)

  const dotCount = 120
  for (let i = 0; i < dotCount; i++) {
    const cx = Math.random() * size
    const cy = Math.random() * size
    const r = size * (0.003 + Math.random() * 0.008)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    const a = 0.15 + Math.random() * 0.25
    g.addColorStop(0, `rgba(255,255,255,${a})`)
    g.addColorStop(0.4, `rgba(255,255,255,${a * 0.6})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  tex.update(false)
  return tex
}