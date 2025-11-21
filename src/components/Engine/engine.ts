import type { World } from '@/types/common'
import {
  ArcRotateCamera,
  Color3,
  DynamicTexture,
  Engine as BabylonEngine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3
} from '@babylonjs/core'

class _EngineService {
  // Headless/game state
  public world: World | null = null

  // Babylon rendering state
  private engine: BabylonEngine | null = null
  private scene: Scene | null = null
  private canvas: HTMLCanvasElement | null = null

  private initialized = false

  async init (world: World): Promise<void> {
    if (this.initialized) return
    this.world = world
    this.initialized = true
  }

  attach (container: HTMLElement): void {
    if (this.engine) return // already attached

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    canvas.setAttribute('touch-action', 'none')
    container.appendChild(canvas)
    this.canvas = canvas

    // Create engine/scene
    const engine = new BabylonEngine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    const scene = new Scene(engine)
    this.engine = engine
    this.scene = scene

    // Camera and light
    const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 10, Vector3.Zero(), scene)
    camera.attachControl(canvas, true)
    new HemisphericLight('light', new Vector3(0, 1, 0), scene)

    // Simple ground to visualize
    this.createCheckerboardPlane(scene)

    // Render loop
    engine.runRenderLoop(() => {
      scene.render()
    })

    // Initial resize
    engine.resize()

    // Hook resize
    window.addEventListener('resize', this.onResize)
  }

  detach (): void {
    window.removeEventListener('resize', this.onResize)
    if (this.engine) {
      try { this.engine.stopRenderLoop() } catch { /* ignore */ }
    }
    if (this.scene) {
      try { this.scene.dispose() } catch { /* ignore */ }
    }
    if (this.engine) {
      try { this.engine.dispose() } catch { /* ignore */ }
    }
    if (this.canvas && this.canvas.parentElement) {
      try { this.canvas.parentElement.removeChild(this.canvas) } catch { /* ignore */ }
    }
    this.canvas = null
    this.scene = null
    this.engine = null
  }

  private onResize = () => {
    if (this.engine) this.engine.resize()
  }

  private createCheckerboardPlane (scene: Scene) {
    const ground = MeshBuilder.CreateGround('checkerboard', { width: 8, height: 8, subdivisions: 8 }, scene)

    const texSize = 512
    const squares = 8
    const dt = new DynamicTexture('checkerTexture', { width: texSize, height: texSize }, scene, false)
    const ctx = dt.getContext()
    if (ctx) {
      const squareSize = texSize / squares
      for (let y = 0; y < squares; y++) {
        for (let x = 0; x < squares; x++) {
          const isDark = ((x + y) % 2) === 1
          ctx.fillStyle = isDark ? '#333333' : '#DDDDDD'
          ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize)
        }
      }
      dt.update()
    }

    const mat = new StandardMaterial('checkerMat', scene)
    mat.diffuseTexture = dt
    mat.specularColor = Color3.Black()
    ground.material = mat
  }
}

export const EngineService = new _EngineService()
