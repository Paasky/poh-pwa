import { Matrix, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode } from "@babylonjs/core";
import { BaseOverlay } from "./BaseOverlay";
import { Tile } from "@/Common/Models/Tile";
import {
  EngineAlpha,
  EngineColors,
  EngineLayers,
  EngineOverlaySettings,
  toColor3,
} from "@/Player/Human/EngineStyles";

export type GuidanceItem = {
  tile: Tile;
  type: "selection" | "target" | "breadcrumb";
  placement?: "top" | "center" | "bottom";
};
export type GuidancePayload = { items: GuidanceItem[] };

/**
 * GuidanceOverlay manages high-performance markers (selection, targets, breadcrumbs)
 * using Babylon.js thin instances.
 */
export class GuidanceOverlay extends BaseOverlay<GuidancePayload> {
  private readonly root: TransformNode;
  private readonly markerMeshes = new Map<string, Mesh>();
  private readonly instanceBuffers = new Map<string, Float32Array>();

  constructor(private readonly scene: Scene) {
    super();
    this.root = new TransformNode("guidanceRoot", scene);
    this.initMeshes();
  }

  private initMeshes() {
    const renderingGroup = EngineLayers.guidance.group;
    const zOffset = EngineLayers.guidance.offset;

    // Selection Ring
    const selection = MeshBuilder.CreateDisc(
      "marker_selection",
      { radius: 1.05, tessellation: 6 },
      this.scene,
    );
    selection.rotation.set(Math.PI / 2, Math.PI / 6, 0);
    const selectionMaterial = new StandardMaterial("marker_selection_mat", this.scene);
    selectionMaterial.emissiveColor = toColor3(EngineColors.selection);
    selectionMaterial.alpha = EngineAlpha.selectionRing;
    selectionMaterial.disableLighting = true;
    selectionMaterial.zOffset = zOffset;
    selection.material = selectionMaterial;

    // Breadcrumb
    const breadcrumb = MeshBuilder.CreateDisc(
      "marker_breadcrumb",
      { radius: 0.1, tessellation: 12 },
      this.scene,
    );
    breadcrumb.rotation.x = Math.PI / 2;
    const breadcrumbMaterial = new StandardMaterial("marker_breadcrumb_mat", this.scene);
    breadcrumbMaterial.emissiveColor = toColor3(EngineColors.move);
    breadcrumbMaterial.disableLighting = true;
    breadcrumbMaterial.zOffset = zOffset - 0.1;
    breadcrumb.material = breadcrumbMaterial;

    // Target
    const target = MeshBuilder.CreateDisc(
      "marker_target",
      { radius: 0.5, tessellation: 12 },
      this.scene,
    );
    target.rotation.x = Math.PI / 2;
    const targetMaterial = new StandardMaterial("marker_target_mat", this.scene);
    targetMaterial.emissiveColor = toColor3(EngineColors.target);
    targetMaterial.disableLighting = true;
    targetMaterial.zOffset = zOffset;
    target.material = targetMaterial;

    [selection, breadcrumb, target].forEach((mesh) => {
      mesh.renderingGroupId = renderingGroup;
      mesh.parent = this.root;
      mesh.isVisible = false;
      mesh.isPickable = false;
    });

    this.markerMeshes.set("selection", selection);
    this.markerMeshes.set("breadcrumb", breadcrumb);
    this.markerMeshes.set("target", target);
  }

  protected onRefresh(): void {
    if (this.dirtyLayers.size === 0) return;

    const typeGroups = new Map<string, Matrix[]>();

    // Recalculate all active layers
    for (const [layerId, payload] of this.layers) {
      if (!this.layerVisibility.get(layerId)) continue;
      for (const item of payload.items) {
        if (!typeGroups.has(item.type)) typeGroups.set(item.type, []);

        const worldPos = item.tile.worldPosition;
        let placementZOffset = 0;
        if (item.placement === "bottom") placementZOffset = -1.0;
        else if (item.placement === "top") placementZOffset = 1.0;

        typeGroups
          .get(item.type)!
          .push(
            Matrix.Translation(
              worldPos.x,
              EngineOverlaySettings.guidanceHeight,
              worldPos.z + placementZOffset,
            ),
          );
      }
    }

    // Update thin instances for each marker type
    for (const [type, mesh] of this.markerMeshes) {
      const matrices = typeGroups.get(type) || [];
      mesh.isVisible = matrices.length > 0;

      if (mesh.isVisible) {
        const requiredBufferSize = matrices.length * 16;
        let buffer = this.instanceBuffers.get(type);

        // PERF: Reuse buffer and only re-allocate if it grows
        if (!buffer || buffer.length < requiredBufferSize) {
          buffer = new Float32Array(requiredBufferSize);
          this.instanceBuffers.set(type, buffer);
        }

        matrices.forEach((matrix, index) => matrix.copyToArray(buffer!, index * 16));

        // Upload only the needed portion of the buffer
        const uploadBuffer =
          buffer.length === requiredBufferSize ? buffer : buffer.subarray(0, requiredBufferSize);

        mesh.thinInstanceSetBuffer("matrix", uploadBuffer, 16, true);
        mesh.thinInstanceCount = matrices.length;
      } else {
        mesh.thinInstanceCount = 0;
      }
    }
  }

  dispose(): void {
    // Explicitly dispose of materials and meshes to avoid GPU leaks
    for (const mesh of this.markerMeshes.values()) {
      mesh.material?.dispose();
      mesh.dispose();
    }
    this.markerMeshes.clear();
    this.instanceBuffers.clear();
    this.root.dispose();
  }
}
