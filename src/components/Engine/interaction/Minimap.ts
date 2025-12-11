import {
  ArcRotateCamera,
  Camera,
  Color4,
  Engine as BabylonEngine,
  HemisphericLight,
  Scene,
  Vector3
} from '@babylonjs/core'
import type { WorldState } from '@/types/common'
import { CreateScreenshotUsingRenderTarget } from '@babylonjs/core/Misc/screenshotTools'
import { TerrainMeshBuilder } from '@/factories/TerrainMeshBuilder/TerrainMeshBuilder'
import { useObjectsStore } from '@/stores/objectStore'
import { getWorldDepth, getWorldWidth } from '@/helpers/math'

export class Minimap {
  world: WorldState
  canvas: HTMLCanvasElement
  engine: BabylonEngine
  scene: Scene
  camera: ArcRotateCamera
  light: HemisphericLight
  terrain: TerrainMeshBuilder

  constructor (
    world: WorldState,
    canvas: HTMLCanvasElement,
    engine: BabylonEngine,
  ) {
    this.world = world
    this.canvas = canvas
    this.engine = engine

    // Create an isolated, low-cost scene just for minimap capture
    this.scene = new Scene(this.engine)
    this.scene.autoClear = true
    this.scene.fogEnabled = false
    this.scene.clearColor = new Color4(0.6, 0.7, 0.75, 1) // neutral sky-ish color

    // Minimal ambient light for flat, readable colors (no shadows, no post FX)
    this.light = new HemisphericLight('minimapHemi', new Vector3(0, 1, 0), this.scene)
    this.light.intensity = 0.9

    // Top-down orthographic camera centered on the world
    this.camera = new ArcRotateCamera(
      'minimapCamera',
      Math.PI / 2, // look North
      0.0001, // nearly top-down
      10,
      new Vector3(0, 0, 0),
      this.scene,
    )
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA

    // Lock rotation/tilt
    this.camera.lowerAlphaLimit = Math.PI / 2
    this.camera.upperAlphaLimit = Math.PI / 2
    this.camera.lowerBetaLimit = 0
    this.camera.upperBetaLimit = 0
    this.camera.panningSensibility = 0

    // Cover the full world extents with a small margin
    const halfWidth = getWorldWidth(this.world.sizeX) / 2
    const halfDepth = getWorldDepth(this.world.sizeY) / 2
    this.camera.orthoLeft = -halfWidth
    this.camera.orthoRight = halfWidth
    this.camera.orthoBottom = -halfDepth
    this.camera.orthoTop = halfDepth
    // No controls attached; this.camera is used only for one-off minimap capture

    // Build a simple terrain for the minimap to capture
    this.terrain = new TerrainMeshBuilder(
      this.scene,
      { x: this.world.sizeX, y: this.world.sizeY },
      useObjectsStore().getTiles,
      1
    )
  }

  capture (): void {
    // Render a 512x256 screenshot using the orthographic minimap camera and draw it to the canvas.
    // For consistency, render with neutral, temporary lights and no fog so the minimap
    // is not affected by the current world environment (time of day, weather, fog, post FX).
    const width = 512
    const height = 256

    // Perform capture
    CreateScreenshotUsingRenderTarget(
      this.engine,
      this.camera,
      { width, height },
      (data) => {
        // Draw into the minimap canvas
        const renderingContext2d = this.canvas.getContext('2d')!
        const imageElement = new Image()
        imageElement.onload = () => {
          renderingContext2d.clearRect(0, 0, width, height)
          renderingContext2d.drawImage(imageElement, 0, 0, width, height)
        }
        imageElement.src = data as string
      },
    )
  }
}