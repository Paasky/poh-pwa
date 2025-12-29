import { Scene, TransformNode } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, StackPanel, TextBlock } from "@babylonjs/gui";
import { BaseOverlay } from "./BaseOverlay";
import { Tile } from "@/Common/Models/Tile";
import getIcon from "@/types/icons";
import { EngineOverlaySettings } from "@/engine/EngineStyles";

export type DetailItem = {
  tile: Tile;
  label?: string;
  icon?: string;
  iconColor?: string;
  placement: "top" | "center" | "bottom";
};
export type DetailPayload = { items: DetailItem[] };

/**
 * DetailOverlay handles drawing 2D GUI elements (labels, icons) linked to 3D positions.
 * It uses a 'ghost' TransformNode to anchor the GUI elements in the scene.
 */
export class DetailOverlay extends BaseOverlay<DetailPayload> {
  private readonly root: TransformNode;
  private readonly layerControls = new Map<
    string,
    { container: Control; ghost: TransformNode }[]
  >();

  constructor(
    private readonly scene: Scene,
    private readonly guiTexture: AdvancedDynamicTexture,
  ) {
    super();
    this.root = new TransformNode("detailRoot", scene);
  }

  protected onLayerRemoved(layerId: string): void {
    this.disposeLayerControls(layerId);
  }

  protected onVisibilityChanged(layerId: string, isEnabled: boolean): void {
    this.layerControls
      .get(layerId)
      ?.forEach((control) => (control.container.isVisible = isEnabled));
  }

  private disposeLayerControls(layerId: string): void {
    this.layerControls.get(layerId)?.forEach((control) => {
      control.container.dispose();
      control.ghost.dispose();
    });
    this.layerControls.delete(layerId);
  }

  protected onRefresh(): void {
    if (this.dirtyLayers.size === 0) return;

    for (const layerId of this.dirtyLayers) {
      this.disposeLayerControls(layerId);
      const payload = this.layers.get(layerId);
      if (!payload) continue;

      const controls: { container: Control; ghost: TransformNode }[] = [];

      for (const item of payload.items) {
        if (!item.label && !item.icon) continue;

        const container = new StackPanel(`detail_container_${layerId}`);
        container.isVertical = false;
        container.adaptWidthToChildren = true;
        container.adaptHeightToChildren = true;

        if (item.icon) {
          const iconDef = getIcon(item.icon);
          const iconTextBlock = new TextBlock();
          const unicode = iconDef.icon.icon[3];
          if (typeof unicode === "string") {
            iconTextBlock.text = String.fromCodePoint(parseInt(unicode, 16));
            iconTextBlock.color = item.iconColor || iconDef.color || "white";
            iconTextBlock.fontFamily = "FontAwesome";
            iconTextBlock.fontSize = EngineOverlaySettings.detailFontSize;
            iconTextBlock.width = EngineOverlaySettings.detailIconWidth;
            iconTextBlock.outlineWidth = EngineOverlaySettings.detailIconOutlineWidth;
            iconTextBlock.outlineColor = "black";
            container.addControl(iconTextBlock);
          }
        }

        if (item.label) {
          const labelTextBlock = new TextBlock();
          labelTextBlock.text = item.label;
          labelTextBlock.color = "white";
          labelTextBlock.fontSize = EngineOverlaySettings.detailFontSize;
          labelTextBlock.outlineWidth = EngineOverlaySettings.detailOutlineWidth;
          labelTextBlock.outlineColor = "black";
          labelTextBlock.resizeToFit = true;
          container.addControl(labelTextBlock);
        }

        this.guiTexture.addControl(container);

        const ghostNode = new TransformNode(`detail_ghost_${layerId}`, this.scene);
        const worldPosition = item.tile.worldPosition;
        let verticalOffset = 0;

        if (item.placement === "bottom") {
          verticalOffset = -0.5;
          container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        } else if (item.placement === "top") {
          verticalOffset = 0.5;
          container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        } else {
          container.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        }

        ghostNode.position.set(
          worldPosition.x,
          EngineOverlaySettings.detailHeight,
          worldPosition.z + verticalOffset,
        );
        ghostNode.parent = this.root;
        container.linkWithMesh(ghostNode);
        container.isVisible = this.layerVisibility.get(layerId) ?? true;

        controls.push({ container, ghost: ghostNode });
      }
      this.layerControls.set(layerId, controls);
    }
  }

  dispose(): void {
    this.root.dispose();
    for (const layerId of this.layerControls.keys()) {
      this.disposeLayerControls(layerId);
    }
    this.layerControls.clear();
    this.dirtyLayers.clear();
  }
}
