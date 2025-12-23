import {
  Color3,
  Matrix,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { Tile } from "@/objects/game/Tile";
import { IOverlay } from "@/components/Engine/overlays/IOverlay";
import { getOverlayAlpha } from "@/components/Engine/overlays/OverlayConstants";

export type MarkerType = "selection" | "target" | "breadcrumb" | "turnMarker";

export type MarkerItem = {
  tile: Tile;
  type: MarkerType;
  label?: string;
};

export type MarkerPayload = {
  items: MarkerItem[];
};

export class MarkerOverlay implements IOverlay<MarkerPayload> {
  private readonly scene: Scene;
  private readonly root: TransformNode;
  private readonly guiTexture: AdvancedDynamicTexture;

  private readonly layers: Map<string, MarkerPayload> = new Map();
  private readonly layerVisibility: Map<string, boolean> = new Map();

  private readonly markerMeshes: Map<MarkerType, Mesh> = new Map();
  private readonly labels: Map<string, TextBlock[]> = new Map();
  private readonly labelGhosts: Map<string, TransformNode[]> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.root = new TransformNode("markerOverlayRoot", scene);
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("MarkerGUI", true, scene);

    this.initMarkerMeshes();
  }

  private initMarkerMeshes(): void {
    // 1. Selection Ring
    const selection = MeshBuilder.CreateDisc(
      "marker_selection",
      { radius: 1.05, tessellation: 6 },
      this.scene,
    );
    selection.rotation.x = Math.PI / 2;
    selection.rotation.y = Math.PI / 6;
    const selectionMat = new StandardMaterial("selectionMat", this.scene);
    selectionMat.emissiveColor = new Color3(1, 1, 1);
    selectionMat.alpha = 0.5;
    selectionMat.disableLighting = true;
    selectionMat.zOffset = -2;
    selection.material = selectionMat;
    selection.parent = this.root;
    selection.renderingGroupId = 4;
    selection.isPickable = false;
    selection.isVisible = false;
    this.markerMeshes.set("selection", selection);

    // 2. Breadcrumb
    const breadcrumb = MeshBuilder.CreateDisc(
      "marker_breadcrumb",
      { radius: 0.1, tessellation: 12 },
      this.scene,
    );
    breadcrumb.rotation.x = Math.PI / 2;
    const breadcrumbMat = new StandardMaterial("breadcrumbMat", this.scene);
    breadcrumbMat.emissiveColor = new Color3(1, 1, 1);
    breadcrumbMat.disableLighting = true;
    breadcrumbMat.zOffset = -3;
    breadcrumb.material = breadcrumbMat;
    breadcrumb.parent = this.root;
    breadcrumb.renderingGroupId = 4;
    breadcrumb.isPickable = false;
    breadcrumb.isVisible = false;
    this.markerMeshes.set("breadcrumb", breadcrumb);

    // 3. Target
    const target = MeshBuilder.CreateDisc(
      "marker_target",
      { radius: 0.5, tessellation: 12 },
      this.scene,
    );
    target.rotation.x = Math.PI / 2;
    const targetMat = new StandardMaterial("targetMat", this.scene);
    targetMat.emissiveColor = new Color3(1, 0.2, 0.2);
    targetMat.disableLighting = true;
    targetMat.zOffset = -2;
    target.material = targetMat;
    target.parent = this.root;
    target.renderingGroupId = 4;
    target.isPickable = false;
    target.isVisible = false;
    this.markerMeshes.set("target", target);
  }

  setLayer(id: string, payload: MarkerPayload | null): this {
    this.clearLabels(id);

    if (!payload) {
      this.layers.delete(id);
    } else {
      this.layers.set(id, payload);
      if (!this.layerVisibility.has(id)) {
        this.layerVisibility.set(id, true);
      }

      // Handle labels immediately
      this.createLabels(id, payload);
    }

    this.updateThinInstances();
    return this;
  }

  showLayer(id: string, isEnabled: boolean): void {
    this.layerVisibility.set(id, isEnabled);

    const labels = this.labels.get(id);
    if (labels) {
      for (const label of labels) label.isVisible = isEnabled;
    }

    this.updateThinInstances();
  }

  private updateThinInstances(): void {
    const typeGroups: Map<MarkerType, Matrix[]> = new Map();

    for (const [layerId, payload] of this.layers) {
      if (!this.layerVisibility.get(layerId)) continue;

      for (const item of payload.items) {
        if (item.type === "turnMarker") continue; // Handled by GUI

        if (!typeGroups.has(item.type)) typeGroups.set(item.type, []);

        const pos = item.tile.worldPosition;
        const matrix = Matrix.Translation(pos.x, pos.y + 0.12, pos.z);
        typeGroups.get(item.type)!.push(matrix);
      }
    }

    for (const [type, mesh] of this.markerMeshes) {
      const matrices = typeGroups.get(type) || [];
      if (matrices.length === 0) {
        mesh.thinInstanceCount = 0;
        mesh.isVisible = false;
      } else {
        const buffer = new Float32Array(matrices.length * 16);
        for (let i = 0; i < matrices.length; i++) {
          matrices[i].copyToArray(buffer, i * 16);
        }
        mesh.thinInstanceSetBuffer("matrix", buffer, 16, true);
        mesh.thinInstanceCount = matrices.length;
        mesh.isVisible = true;
      }
    }
  }

  private createLabels(id: string, payload: MarkerPayload): void {
    const labels: TextBlock[] = [];
    const ghosts: TransformNode[] = [];

    for (const item of payload.items) {
      if (item.label) {
        const text = new TextBlock();
        text.text = item.label;
        text.color = "white";
        text.fontSize = 16;
        text.fontWeight = "bold";
        text.outlineWidth = 3;
        text.outlineColor = "black";
        this.guiTexture.addControl(text);

        const ghost = new TransformNode(`ghost_${id}`, this.scene);
        const pos = item.tile.worldPosition;
        ghost.position.set(pos.x, pos.y + 0.2, pos.z);
        ghost.parent = this.root;
        text.linkWithMesh(ghost);

        labels.push(text);
        ghosts.push(ghost);
      }
    }

    if (labels.length > 0) {
      this.labels.set(id, labels);
      this.labelGhosts.set(id, ghosts);
    }
  }

  private clearLabels(id: string): void {
    const labels = this.labels.get(id);
    if (labels) {
      for (const label of labels) label.dispose();
      this.labels.delete(id);
    }
    const ghosts = this.labelGhosts.get(id);
    if (ghosts) {
      for (const ghost of ghosts) ghost.dispose();
      this.labelGhosts.delete(id);
    }
  }

  setScaling(scale: number): void {
    const alpha = getOverlayAlpha(scale);
    for (const mesh of this.markerMeshes.values()) {
      if (mesh.material) mesh.material.alpha = alpha;
    }
  }

  dispose(): void {
    this.guiTexture.dispose();
    this.root.dispose();
    this.markerMeshes.clear();
    this.labels.clear();
    this.labelGhosts.clear();
  }
}
