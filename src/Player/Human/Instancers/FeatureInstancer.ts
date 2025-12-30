import { tileCenter } from "@/helpers/math";
import { Coords, tileHeight } from "@/helpers/mapTools";
import type { GameKey } from "@/Common/Models/_GameModel";
import type { Tile } from "@/Common/Models/Tile";
import { Matrix, Mesh, Quaternion, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { FeatureGroup, featureMeshMap } from "@/Player/Human/Assets/meshes/features";
import { buildRandomPointsInHex } from "@/helpers/hexPointSampling";
import { EngineLayers } from "@/Player/Human/EngineStyles";

export default class FeatureInstancer {
  scene: Scene;
  size: Coords;
  isVisible = true;

  root: TransformNode;
  lib: Record<FeatureGroup, { mesh: Mesh; indices: Record<GameKey, number> }>;

  constructor(scene: Scene, size: Coords, tiles: Tile[], parent: TransformNode) {
    this.scene = scene;
    this.size = size;
    this.root = new TransformNode("featuresRoot", this.scene);
    this.root.parent = parent;

    this.lib = {} as Record<FeatureGroup, { mesh: Mesh; indices: Record<GameKey, number> }>;
    for (const featureGroup of Object.keys(featureMeshMap) as FeatureGroup[]) {
      const getMesh = featureMeshMap[featureGroup];
      const mesh = getMesh(this.scene);
      mesh.setEnabled(false);
      mesh.parent = this.root;
      mesh.isPickable = false;
      mesh.renderingGroupId = EngineLayers.features.group;

      this.lib[featureGroup] = {
        mesh,
        indices: {},
      };
    }

    // Initial full build for forests using SPS
    this.set(tiles);

    return this;
  }

  private getForestSpec(group: FeatureGroup): {
    count: number;
    minSpace?: number;
    scaleJitter: number;
  } {
    switch (group) {
      case "pineTree":
      case "leafTree":
      case "jungleTree":
        return { count: 8, scaleJitter: 0.1 };
      case "palmTree":
        return { count: 5, minSpace: 0.25, scaleJitter: 0.25 };
      case "bush":
        return { count: 8, scaleJitter: 0.25 };
      case "kelp":
        return { count: 18, scaleJitter: 0.2 };
      case "floodPlain":
        return { count: 18, scaleJitter: 0.2 };
      case "swamp":
        return { count: 5, minSpace: 0.25, scaleJitter: 0.5 };
      case "ice":
        return { count: 6, scaleJitter: 0.5 };
      case "atoll":
        return { count: 1, scaleJitter: 0.0 };
      case "lagoon":
        return { count: 1, scaleJitter: 0.0 };
      case "tradeWind":
        return { count: 2, scaleJitter: 0.0 };
    }
  }

  setIsVisible(isVisible: boolean): this {
    this.isVisible = isVisible;
    this.root.setEnabled(isVisible);
    return this;
  }

  public set(tiles: Tile[]): this {
    const tilesPerGroup = {
      pineTree: [],
      leafTree: [],
      jungleTree: [],
      palmTree: [],
      bush: [],
      kelp: [],
      ice: [],
      atoll: [],
      floodPlain: [],
      swamp: [],
      lagoon: [],
      tradeWind: [],
    } as Record<FeatureGroup, Tile[]>;

    for (const tile of tiles) {
      const featureGroup = this.getFeatureGroup(tile);
      if (!featureGroup) continue;
      tilesPerGroup[featureGroup].push(tile);
    }

    for (const featureGroup of Object.keys(tilesPerGroup) as FeatureGroup[]) {
      const groupTiles = tilesPerGroup[featureGroup];
      const lib = this.lib[featureGroup];

      // Reset indices for this batch
      lib.indices = {};

      if (groupTiles.length === 0) {
        // Clear thin instances and hide mesh
        lib.mesh.thinInstanceSetBuffer("matrix", new Float32Array(0), 16);
        lib.mesh.isVisible = false;
        lib.mesh.setEnabled(false);
        continue;
      }

      const spec = this.getForestSpec(featureGroup);

      // Pre-size buffer for total instances across tiles
      const totalInstances = groupTiles.reduce((sum, _t) => sum + spec.count, 0);
      const stride = 16;
      const data = new Float32Array(totalInstances * stride);

      const rotation = Quaternion.Identity();
      const m = new Matrix();

      let instanceIndex = 0;

      for (const tile of groupTiles) {
        // record first instance index for this tile
        lib.indices[tile.key] = instanceIndex;

        const c = tileCenter(this.size, tile);
        const y = tileHeight(tile, true);

        let points: { x: number; z: number }[];
        if (featureGroup === "lagoon" || featureGroup === "atoll") {
          points = [{ x: 0, z: 0 }];
        } else if (featureGroup === "tradeWind") {
          // Two points roughly NE and SW of center
          points = [
            { x: 0.35, z: -0.35 },
            { x: -0.35, z: 0.35 },
          ];
        } else if (spec.minSpace !== undefined) {
          points = buildRandomPointsInHex(spec.count, "semi-even", spec.minSpace);
        } else {
          points = buildRandomPointsInHex(spec.count);
        }

        for (const p of points) {
          const position = new Vector3(c.x + p.x, y, c.z + p.z);
          const jitter = spec.scaleJitter;
          const s = jitter > 0 ? 1 + (Math.random() * 2 - 1) * jitter : 1;
          const scale = new Vector3(s, s, s);

          // Orientation: special cases
          if (featureGroup === "tradeWind") {
            // Point west (assume +X is east in local mesh), rotate PI around Y
            const rotY = Quaternion.FromEulerAngles(0, Math.PI, 0);
            Matrix.ComposeToRef(scale, rotY, position, m);
          } else {
            // Randomize yaw for palms so each points a different direction
            if (featureGroup === "palmTree") {
              const yaw = Math.random() * Math.PI * 2;
              const rotY = Quaternion.FromEulerAngles(0, yaw, 0);
              Matrix.ComposeToRef(scale, rotY, position, m);
            } else {
              Matrix.ComposeToRef(scale, rotation, position, m);
            }
          }
          m.copyToArray(data, instanceIndex * stride);
          instanceIndex++;
        }
      }

      lib.mesh.thinInstanceSetBuffer("matrix", data, stride, true);
      // Ensure the source mesh is actually rendered (isVisible was false in factories)
      lib.mesh.isVisible = this.isVisible;
      lib.mesh.setEnabled(this.isVisible);
      // Refresh bounds so thin instances aren’t culled by the tiny source bounds
      const maybeTI = lib.mesh as unknown as {
        thinInstanceRefreshBoundingInfo?: (force?: boolean) => void;
      };
      maybeTI.thinInstanceRefreshBoundingInfo?.(true);

      // Add a subtle global wiggle animation for tradewinds to hint at motion
      if (featureGroup === "tradeWind") {
        const mesh = lib.mesh;
        const anyMesh = mesh as unknown as { __windAnim?: boolean };
        if (!anyMesh.__windAnim) {
          anyMesh.__windAnim = true;
          let t = 0;
          this.scene.onBeforeRenderObservable.add(() => {
            if (!mesh.isDisposed()) {
              t += this.scene.getEngine().getDeltaTime() * 0.0015;
              // base orientation already points west via instance rotation; add tiny sway
              mesh.rotation.y = 0.02 * Math.sin(t * 2);
              mesh.position.y = 0.01 * Math.sin(t * 3);
            }
          });
        }
      }
    }

    return this;
  }

  dispose(): void {
    for (const lib of Object.values(this.lib)) {
      lib.mesh.dispose(false, true);
    }
    this.root.dispose(false, true);
  }

  private getFeatureGroup(tile: Tile): FeatureGroup | null {
    if (tile.feature.value?.id === "pineForest") return "pineTree";
    if (tile.feature.value?.id === "forest") return "leafTree";
    if (tile.feature.value?.id === "jungle") return "jungleTree";
    if (tile.feature.value?.id === "shrubs") return "bush";
    if (tile.feature.value?.id === "oasis") return "palmTree";
    if (tile.feature.value?.id === "floodPlain") return "floodPlain";
    if (tile.feature.value?.id === "swamp") return "swamp";
    if (tile.feature.value?.id === "ice") return "ice";
    if (tile.feature.value?.id === "kelp") return "kelp";
    if (tile.feature.value?.id === "lagoon") return "lagoon";
    if (tile.feature.value?.id === "atoll") return "atoll";
    if (tile.feature.value?.id === "tradeWind") return "tradeWind";
    return null;
  }

  // Thin instances do not require per-group initialization helpers
}
