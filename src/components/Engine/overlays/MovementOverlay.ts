import {
  AbstractMesh,
  Color3,
  Color4,
  Curve3,
  LinesMesh,
  Matrix,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { Tile } from "@/objects/game/Tile";
import { Coords, tileHeight } from "@/helpers/mapTools";
import { tileCenter } from "@/helpers/math";
import { PathStep } from "@/services/PathfinderService";
import { GameKey } from "@/objects/game/_GameObject";

/** Movement Overlay API */
export class MovementOverlay {
  private scene: Scene;
  private size: Coords;
  private root: TransformNode;

  // Reachable highlight (Context Overlay)
  private reachableMesh: Mesh;
  private reachableMatrices: Float32Array;
  private reachableColors: Float32Array;
  private reachableCount = 0;

  // Path visualization (Current/Potential Overlay)
  private potentialPathLine: LinesMesh | null = null;
  private currentPathLine: LinesMesh | null = null;
  private breadcrumbs: Mesh;
  private breadcrumbMatrices: Float32Array;
  private breadcrumbCount = 0;

  // GUI for turn markers
  private guiTexture: AdvancedDynamicTexture;
  private turnMarkers: TextBlock[] = [];
  private turnMarkerGhosts: AbstractMesh[] = [];

  // Selection marker
  private selectionMarker: Mesh | null = null;

  /**
   * @param scene The BabylonJS scene
   * @param size The map dimensions for coordinate calculations
   */
  constructor(scene: Scene, size: Coords) {
    this.scene = scene;
    this.size = size;
    this.root = new TransformNode("movementOverlayRoot", scene);

    // 1. Reachable highlight mesh (ThinInstance)
    this.reachableMesh = MeshBuilder.CreateDisc(
      "reachableHighlight",
      { radius: 0.95, tessellation: 6 },
      scene,
    );
    this.reachableMesh.rotation.x = Math.PI / 2; // Flat
    this.reachableMesh.rotation.y = Math.PI / 6; // Pointy top
    const reachableMat = new StandardMaterial("reachableMat", scene);
    reachableMat.diffuseColor = new Color3(1, 1, 1); // Use vertex colors
    reachableMat.alpha = 0.3;
    reachableMat.disableLighting = true;
    reachableMat.zOffset = -1;
    this.reachableMesh.material = reachableMat;
    this.reachableMesh.parent = this.root;
    this.reachableMesh.renderingGroupId = 3;
    this.reachableMesh.isPickable = false;

    this.reachableMatrices = new Float32Array(16 * 2048);
    this.reachableColors = new Float32Array(4 * 2048);
    this.reachableMesh.thinInstanceSetBuffer("matrix", this.reachableMatrices, 16, true);
    this.reachableMesh.thinInstanceSetBuffer("color", this.reachableColors, 4, true);
    this.reachableMesh.thinInstanceCount = 0;

    // 2. Breadcrumbs (ThinInstance)
    this.breadcrumbs = MeshBuilder.CreateDisc(
      "breadcrumb",
      { radius: 0.1, tessellation: 12 },
      scene,
    );
    this.breadcrumbs.rotation.x = Math.PI / 2;
    const breadcrumbMat = new StandardMaterial("breadcrumbMat", scene);
    breadcrumbMat.emissiveColor = new Color3(1, 1, 1);
    breadcrumbMat.disableLighting = true;
    breadcrumbMat.zOffset = -3;
    this.breadcrumbs.material = breadcrumbMat;
    this.breadcrumbs.parent = this.root;
    this.breadcrumbs.renderingGroupId = 5;
    this.breadcrumbs.isPickable = false;

    this.breadcrumbMatrices = new Float32Array(16 * 512);
    this.breadcrumbs.thinInstanceSetBuffer("matrix", this.breadcrumbMatrices, 16, true);
    this.breadcrumbs.thinInstanceCount = 0;

    // 3. Selection Marker
    this.selectionMarker = MeshBuilder.CreateDisc(
      "selectionMarker",
      { radius: 1.05, tessellation: 6 },
      scene,
    );
    this.selectionMarker.rotation.x = Math.PI / 2;
    this.selectionMarker.rotation.y = Math.PI / 6;
    const selectionMat = new StandardMaterial("selectionMat", scene);
    selectionMat.emissiveColor = new Color3(1, 1, 1);
    selectionMat.alpha = 0.5;
    selectionMat.disableLighting = true;
    selectionMat.zOffset = -2;
    this.selectionMarker.material = selectionMat;
    this.selectionMarker.parent = this.root;
    this.selectionMarker.renderingGroupId = 5;
    this.selectionMarker.setEnabled(false);
    this.selectionMarker.isPickable = false;

    // 4. GUI for turn markers
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("MovementGUI", true, scene);
  }

  /** Renders the reachable area highlight (Context Overlay) */
  setReachableTiles(
    reachableKeys: Set<GameKey>,
    blockedKeys: Set<GameKey>,
    tilesByKey: Record<GameKey, Tile>,
  ): void {
    this.reachableCount = 0;

    const green = new Color4(0, 0.4, 0, 1);
    const red = new Color4(0.5, 0, 0, 1);

    const addInstance = (key: GameKey, color: Color4) => {
      const tile = tilesByKey[key];
      if (!tile) return;
      const center = tileCenter(this.size, tile);
      const height = tileHeight(tile, true) + 0.05;
      const m = Matrix.Translation(center.x, height, center.z);
      m.copyToArray(this.reachableMatrices, this.reachableCount * 16);
      color.toArray(this.reachableColors, this.reachableCount * 4);
      this.reachableCount++;
    };

    for (const key of reachableKeys) addInstance(key, green);
    for (const key of blockedKeys) addInstance(key, red);

    this.reachableMesh.thinInstanceCount = this.reachableCount;
    this.reachableMesh.thinInstanceBufferUpdated("matrix");
    this.reachableMesh.thinInstanceBufferUpdated("color");
  }

  /** Renders the potential path (curved dotted white line) */
  setPotentialPath(path: PathStep[], startTile?: Tile): void {
    if (this.potentialPathLine) {
      this.potentialPathLine.dispose();
      this.potentialPathLine = null;
    }
    this.updatePath(path, false, startTile);
  }

  /** Renders the current path (curved solid white line) */
  setCurrentPath(path: PathStep[], startTile?: Tile): void {
    if (this.currentPathLine) {
      this.currentPathLine.dispose();
      this.currentPathLine = null;
    }
    this.updatePath(path, true, startTile);
  }

  private updatePath(path: PathStep[], isCurrent: boolean, startTile?: Tile): void {
    if (path.length === 0) {
      if (!isCurrent) {
        this.breadcrumbCount = 0;
        this.breadcrumbs.thinInstanceCount = 0;
        this.clearTurnMarkers();
      }
      return;
    }

    const points: Vector3[] = [];
    const wrapWidth = Math.sqrt(3) * this.size.x;

    let referenceX = 0;
    if (startTile) {
      const startCenter = tileCenter(this.size, startTile);
      const p = new Vector3(startCenter.x, tileHeight(startTile, true) + 0.1, startCenter.z);
      points.push(p);
      referenceX = p.x;
    }

    if (!isCurrent) {
      this.breadcrumbCount = 0;
      this.clearTurnMarkers();
    }

    for (const step of path) {
      const center = tileCenter(this.size, step.tile);
      const height = tileHeight(step.tile, true) + 0.1;

      // Unwrap X for visual continuity
      let x = center.x;
      if (points.length > 0) {
        const dx = x - referenceX;
        if (Math.abs(dx) > wrapWidth / 2) {
          x -= Math.sign(dx) * wrapWidth;
        }
      }
      referenceX = x;

      const p = new Vector3(x, height, center.z);
      points.push(p);

      if (!isCurrent) {
        // Breadcrumbs
        const bm = Matrix.Translation(p.x, p.y + 0.02, p.z);
        bm.copyToArray(this.breadcrumbMatrices, this.breadcrumbCount * 16);
        this.breadcrumbCount++;

        // Turn Markers
        if (step.isTurnEnd) {
          this.createTurnMarker(p, step.turn + 1);
        }
      }
    }

    if (!isCurrent) {
      this.breadcrumbs.thinInstanceCount = this.breadcrumbCount;
      this.breadcrumbs.thinInstanceBufferUpdated("matrix");
    }

    if (points.length < 2) return;

    // Curved line - use catmull rom only for 3+ points to avoid potential 2-point glitches
    const linePoints =
      points.length > 2 ? Curve3.CreateCatmullRomSpline(points, 10).getPoints() : points;

    const line = isCurrent
      ? MeshBuilder.CreateLines(
          "currentPathLine",
          {
            points: linePoints,
            updatable: false,
          },
          this.scene,
        )
      : MeshBuilder.CreateDashedLines(
          "potentialPathLine",
          {
            points: linePoints,
            dashSize: 0.5,
            gapSize: 0.2,
            updatable: false,
          },
          this.scene,
        );
    line.renderingGroupId = 5;
    line.isPickable = false;
    line.parent = this.root;

    const mat = new StandardMaterial("pathLineMat", this.scene);
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.disableLighting = true;
    line.material = mat;

    if (isCurrent) {
      this.currentPathLine = line;
    } else {
      this.potentialPathLine = line;
      // TODO: Implement dotted line via shader or texture if needed.
      // For now, solid white is KISS.
    }
  }

  private createTurnMarker(position: Vector3, turn: number): void {
    const text = new TextBlock();
    text.text = `(${turn})`;
    text.color = "white";
    text.fontSize = 16;
    text.fontWeight = "bold";
    text.outlineWidth = 3;
    text.outlineColor = "black";
    this.guiTexture.addControl(text);

    const ghost = new AbstractMesh("turnMarkerGhost", this.scene);
    ghost.position.copyFrom(position);
    ghost.parent = this.root;
    text.linkWithMesh(ghost);

    this.turnMarkers.push(text);
    this.turnMarkerGhosts.push(ghost);
  }

  private clearTurnMarkers(): void {
    for (const marker of this.turnMarkers) {
      marker.dispose();
    }
    this.turnMarkers = [];

    for (const ghost of this.turnMarkerGhosts) {
      ghost.dispose();
    }
    this.turnMarkerGhosts = [];
  }

  /**
   * Adjusts visual thickness/alpha of lines and breadcrumbs based on zoom.
   * Called by MainCamera.applyZoomEffects().
   */
  setScaling(scale: number): void {
    const alpha = 0.3 + (scale - 0.25) * 0.5;
    if (this.potentialPathLine?.material) this.potentialPathLine.material.alpha = alpha;
    if (this.currentPathLine?.material) this.currentPathLine.material.alpha = alpha;
    if (this.breadcrumbs.material) this.breadcrumbs.material.alpha = alpha;
  }

  /** Updates the selection marker position */
  setSelectionMarker(tile: Tile | undefined): void {
    if (!tile) {
      this.selectionMarker?.setEnabled(false);
      return;
    }
    const center = tileCenter(this.size, tile);
    const height = tileHeight(tile, true) + 0.1;
    this.selectionMarker?.position.set(center.x, height, center.z);
    this.selectionMarker?.setEnabled(true);
  }

  /** Clears all movement visuals */
  clear(): void {
    this.reachableCount = 0;
    this.reachableMesh.thinInstanceCount = 0;

    this.breadcrumbCount = 0;
    this.breadcrumbs.thinInstanceCount = 0;

    if (this.potentialPathLine) {
      this.potentialPathLine.dispose();
      this.potentialPathLine = null;
    }
    if (this.currentPathLine) {
      this.currentPathLine.dispose();
      this.currentPathLine = null;
    }
    this.clearTurnMarkers();
  }

  /** Clears and disposes all engine resources */
  dispose(): void {
    this.clearTurnMarkers();
    this.guiTexture.dispose();
    this.root.dispose();
  }
}
