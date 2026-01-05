import {
  CreateGreasedLine,
  Curve3,
  GreasedLineMesh,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { BaseOverlay } from "./BaseOverlay";
import { Tile } from "@/Common/Models/Tile";
import {
  EngineLayers,
  EngineOverlayColors,
  EngineOverlaySettings,
} from "@/Actor/Human/EngineStyles";
import { Coords } from "@/helpers/mapTools";
import { getMapBounds } from "@/helpers/math";

export type PathStyle = {
  colorId: string;
  alpha: number;
  type: "line" | "dash" | "dotted";
  curvature: number;
  width: number;
};
export type PathPayload = { items: { tile: Tile }[]; style: PathStyle };

/**
 * PathOverlay handles drawing tactical lines (paths) with rounded corners in the 'Guidance' group.
 * Supports dashed/dotted styles via GreasedLine.
 */
export class PathOverlay extends BaseOverlay<PathPayload> {
  private readonly root: TransformNode;
  private readonly pathMeshes = new Map<string, GreasedLineMesh>();

  private readonly _vTmp1 = new Vector3();
  private readonly _vTmp2 = new Vector3();
  private readonly _vTmp3 = new Vector3();

  constructor(
    private readonly scene: Scene,
    private readonly size: Coords,
  ) {
    super();
    this.root = new TransformNode("pathRoot", this.scene);
  }

  protected onLayerRemoved(layerId: string): void {
    this.disposeMesh(layerId);
  }

  protected onVisibilityChanged(layerId: string, isEnabled: boolean): void {
    this.pathMeshes.get(layerId)?.setEnabled(isEnabled);
  }

  private disposeMesh(layerId: string): void {
    const mesh = this.pathMeshes.get(layerId);
    if (mesh) {
      mesh.dispose();
      this.pathMeshes.delete(layerId);
    }
  }

  protected onRefresh(): void {
    if (this.dirtyLayers.size === 0) return;

    const { worldWidth } = getMapBounds(this.size);

    for (const layerId of this.dirtyLayers) {
      const payload = this.layers.get(layerId);
      if (!payload || payload.items.length < 2) {
        this.disposeMesh(layerId);
        continue;
      }

      // Calculate path points with world wrapping support
      const points = payload.items.map((item, index) => {
        const worldPos = item.tile.worldPosition.clone();
        worldPos.y = EngineOverlaySettings.pathHeight;

        if (index > 0) {
          const prevPos = payload.items[index - 1].tile.worldPosition;
          // Shortest path wrapping logic for cylindrical maps
          if (Math.abs(worldPos.x - prevPos.x) > worldWidth / 2) {
            if (worldPos.x > prevPos.x) worldPos.x -= worldWidth;
            else worldPos.x += worldWidth;
          }
        }
        return worldPos;
      });

      const linePoints = this.getRoundedPoints(points, payload.style.curvature);

      let totalLength = 0;
      for (let i = 0; i < linePoints.length - 1; i++) {
        totalLength += Vector3.Distance(linePoints[i], linePoints[i + 1]);
      }

      // Recreate mesh to handle varying point counts.
      // GreasedLineMesh.setPoints does not resize underlying buffers, which can cause WebGL warnings
      // when the number of points increases (e.g., transitioning from straight to curved path).
      this.disposeMesh(layerId);
      const mesh = CreateGreasedLine(
        `path_${layerId}`,
        { points: linePoints },
        {
          width: payload.style.width * EngineOverlaySettings.pathWidthFactor,
          color: EngineOverlayColors[payload.style.colorId as keyof typeof EngineOverlayColors],
          useDash: payload.style.type !== "line",
          dashCount: totalLength * (payload.style.type === "dotted" ? 8 : 2),
          dashRatio: 0.5,
          visibility: payload.style.alpha,
        },
        this.scene,
      ) as GreasedLineMesh;

      mesh.parent = this.root;
      mesh.renderingGroupId = EngineLayers.guidance.group;
      if (mesh.material) {
        mesh.material.zOffset = EngineLayers.guidance.offset;
      }
      mesh.setEnabled(this.layerVisibility.get(layerId) ?? true);

      this.pathMeshes.set(layerId, mesh);
    }
  }

  private getRoundedPoints(points: Vector3[], radius: number): Vector3[] {
    const pushPoint = (p: Vector3) => {
      if (result.length === 0 || Vector3.Distance(result[result.length - 1], p) > 0.01) {
        result.push(p);
      }
    };

    const uniquePoints = points.filter(
      (p, i) => i === 0 || Vector3.Distance(p, points[i - 1]) > 0.01,
    );
    if (uniquePoints.length < 3 || radius <= 0) {
      return uniquePoints;
    }

    const result: Vector3[] = [];
    pushPoint(uniquePoints[0]);

    for (let i = 1; i < uniquePoints.length - 1; i++) {
      const pPrev = uniquePoints[i - 1];
      const pCurr = uniquePoints[i];
      const pNext = uniquePoints[i + 1];

      const v1 = pPrev.subtractToRef(pCurr, this._vTmp1);
      const v2 = pNext.subtractToRef(pCurr, this._vTmp2);
      const len1 = v1.length();
      const len2 = v2.length();

      // Effective radius cannot be more than half of either adjacent segment
      const r = Math.min(radius, len1 / 2, len2 / 2);

      if (r < 0.01) {
        pushPoint(pCurr);
        continue;
      }

      const pStart = pCurr.addToRef(v1.normalize().scaleInPlace(r), this._vTmp3).clone();
      const pEnd = pCurr.addToRef(v2.normalize().scaleInPlace(r), this._vTmp3).clone();

      const cornerPoints = Curve3.CreateQuadraticBezier(
        pStart,
        pCurr,
        pEnd,
        EngineOverlaySettings.pathSmoothingSteps,
      ).getPoints();

      cornerPoints.forEach(pushPoint);
      pushPoint(pEnd);
    }

    pushPoint(uniquePoints[uniquePoints.length - 1]);
    return result;
  }

  dispose(): void {
    this.root.dispose();
    this.pathMeshes.clear();
  }
}
