import {
  Color3,
  Curve3,
  LinesMesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { Tile } from "@/objects/game/Tile";
import type { Coords } from "@/helpers/mapTools";
import { IOverlay } from "@/components/Engine/overlays/IOverlay";
import { getOverlayAlpha, OVERLAY_COLORS } from "@/components/Engine/overlays/OverlayConstants";

export type PathStyle = {
  colorId: string;
  alpha: number;
  dashed: boolean;
  width: number;
};

export type PathPayload = {
  items: { tile: Tile }[];
  style: PathStyle;
};

export class PathOverlay implements IOverlay<PathPayload> {
  private readonly scene: Scene;
  private readonly size: Coords;
  private readonly root: TransformNode;
  private readonly paths: Map<string, { mesh: LinesMesh; style: PathStyle }> = new Map();
  private readonly materialCache: Map<string, StandardMaterial> = new Map();

  constructor(scene: Scene, size: Coords) {
    this.scene = scene;
    this.size = size;
    this.root = new TransformNode("pathOverlayRoot", scene);
  }

  private getMaterial(colorId: string): StandardMaterial {
    if (!this.materialCache.has(colorId)) {
      const material = new StandardMaterial(`pathMat_${colorId}`, this.scene);
      material.emissiveColor = OVERLAY_COLORS[colorId] || Color3.White();
      material.disableLighting = true;
      this.materialCache.set(colorId, material);
    }
    return this.materialCache.get(colorId)!;
  }

  setLayer(id: string, payload: PathPayload | null): this {
    const existing = this.paths.get(id);
    if (existing) {
      existing.mesh.dispose();
      this.paths.delete(id);
    }

    if (!payload || payload.items.length < 2) return this;

    const points: Vector3[] = [];
    const wrapWidth = Math.sqrt(3) * this.size.x;
    let referenceX = 0;

    for (let i = 0; i < payload.items.length; i++) {
      const tile = payload.items[i].tile;
      const pos = tile.worldPosition.clone();

      // Floating slightly above ground
      pos.y += 0.1;

      if (points.length > 0) {
        const dx = pos.x - referenceX;
        if (Math.abs(dx) > wrapWidth / 2) {
          pos.x -= Math.sign(dx) * wrapWidth;
        }
      }
      referenceX = pos.x;
      points.push(pos);
    }

    const linePoints =
      points.length > 2 ? Curve3.CreateCatmullRomSpline(points, 10).getPoints() : points;

    const mesh = payload.style.dashed
      ? MeshBuilder.CreateDashedLines(
          `path_${id}`,
          {
            points: linePoints,
            dashSize: 0.5,
            gapSize: 0.2,
            updatable: false,
          },
          this.scene,
        )
      : MeshBuilder.CreateLines(
          `path_${id}`,
          {
            points: linePoints,
            updatable: false,
          },
          this.scene,
        );

    mesh.parent = this.root;
    mesh.isPickable = false;
    mesh.renderingGroupId = 5;

    const mat = this.getMaterial(payload.style.colorId);
    mesh.material = mat;
    // Note: alpha is shared across paths using the same material if we use mat.alpha.
    // However, setScaling updates all path materials' alpha anyway.
    // If different paths need different alphas, we'd need separate materials or use vertex colors.
    // For now, keeping it simple as per KISS.
    mat.alpha = payload.style.alpha;

    this.paths.set(id, { mesh, style: payload.style });

    return this;
  }

  showLayer(id: string, isEnabled: boolean): void {
    const path = this.paths.get(id);
    if (path) {
      path.mesh.setEnabled(isEnabled);
    }
  }

  setScaling(scale: number): void {
    const alpha = getOverlayAlpha(scale);
    for (const path of this.paths.values()) {
      if (path.mesh.material) {
        path.mesh.material.alpha = alpha;
      }
    }
  }

  dispose(): void {
    this.root.dispose();
    this.paths.clear();
    this.materialCache.forEach((mat) => mat.dispose());
    this.materialCache.clear();
  }
}
