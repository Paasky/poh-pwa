import { Color3, Color4, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import { TypeKey } from "@/types/common";
import { Tile } from "@/objects/game/Tile";

export const terrainColorMap: Record<TypeKey, Color4> = {
  "terrainType:coast": Color4.FromHexString("#3d73a5"),
  "terrainType:desert": Color4.FromHexString("#d1d143"),
  "terrainType:grass": Color4.FromHexString("#3f6212"),
  "terrainType:lake": Color4.FromHexString("#505d67"),
  "terrainType:majorRiver": Color4.FromHexString("#50675e"),
  "terrainType:ocean": Color4.FromHexString("#172554"),
  "terrainType:plains": Color4.FromHexString("#81791c"),
  "terrainType:sea": Color4.FromHexString("#1e3a8a"),
  "terrainType:snow": Color4.FromHexString("#ffffff"),
  "terrainType:rocks": Color4.FromHexString("#484848"),
  "terrainType:tundra": Color4.FromHexString("#3b5118"),
};

export const terrainBumpMap: Record<TypeKey, string> = {
  "terrainType:coast": "/textures/bump/sand.png",
  "terrainType:desert": "/textures/bump/sand.png",
  "terrainType:grass": "/textures/bump/grass.png",
  "terrainType:lake": "/textures/bump/sand.png",
  "terrainType:majorRiver": "/textures/bump/sand.png",
  "terrainType:ocean": "/textures/bump/sand.png",
  "terrainType:plains": "/textures/bump/grass.png",
  "terrainType:rocks": "/textures/bump/rocks.png",
  "terrainType:sea": "/textures/bump/sand.png",
  "terrainType:snow": "/textures/bump/snow.png",
  "terrainType:tundra": "/textures/bump/grass.png",
};

export const allTerrainMaterials = (scene: Scene): Record<TypeKey, StandardMaterial> => {
  const out = {} as Record<TypeKey, StandardMaterial>;
  for (const [key, color] of Object.entries(terrainColorMap) as [TypeKey, Color4][]) {
    const mat = new StandardMaterial(`mat-${key}`, scene);
    mat.diffuseColor = asColor3(color);
    mat.specularColor = Color3.Black();
    mat.bumpTexture = new Texture(terrainBumpMap[key], scene);
    out[key] = mat;
  }
  return out;
};

export const colorOf = (tile: Tile, isCenter: boolean = false): Color4 => {
  if (isCenter) {
    if (tile.elevation.key === "elevationType:mountain")
      return terrainColorMap["terrainType:rocks"];
    if (tile.elevation.key === "elevationType:snowMountain")
      return terrainColorMap["terrainType:snow"];
  }

  return terrainColorMap[tile.terrain.key] ?? new Color4(255, 0, 128, 1);
};

export const asColor3 = (color: Color4): Color3 => new Color3(color.r, color.g, color.b);

export const bumpMapOf = (tile: Tile): string => terrainBumpMap[tile.terrain.key];
