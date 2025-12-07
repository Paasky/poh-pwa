import { MeshBuilder, Scene } from "@babylonjs/core";

const height = 0.05;

// Base hex geometry (pointy-top)
export const getBaseTile = (scene: Scene) => {
  const tile = MeshBuilder.CreateCylinder(
    "baseTile",
    { height, diameter: 2, tessellation: 6 },
    scene,
  );

  // Rotate 30° around Y so the hex becomes pointy-top to match our odd-r layout.
  tile.rotation.y = Math.PI / 6;
  tile.isVisible = false; // masters are hidden; instances render

  return tile;
};
