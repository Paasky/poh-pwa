import { Color3, Color4, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import { TypeKey } from "@/types/common";
import { Tile } from "@/objects/game/Tile";

export const terrainColorMap: Record<TypeKey, Color4> = {
  "terrainType:coast": Color4.FromHexString("#3d73a5"),
  "terrainType:desert": Color4.FromHexString("#b3a500"),
  "terrainType:grass": Color4.FromHexString("#3f6212"),
  "terrainType:lake": Color4.FromHexString("#505d67"),
  "terrainType:majorRiver": Color4.FromHexString("#50675e"),
  "terrainType:ocean": Color4.FromHexString("#172554"),
  "terrainType:plains": Color4.FromHexString("#a58111"),
  "terrainType:sea": Color4.FromHexString("#1e3a8a"),
  "terrainType:snow": Color4.FromHexString("#a0a0a0"),
  "terrainType:rocks": Color4.FromHexString("#424242"),
  "terrainType:tundra": Color4.FromHexString("#3e5234"),
};

// Normal map file paths (served from /public). These are placeholders you can replace.
// Shared groups:
// - "sandy" for: ocean, sea, coast, lake, majorRiver, desert
// - "undergrowth" for: tundra, grass, plains
// - "rock" for: rocks
// - "snow" for: snow
export const terrainNormalMap: Record<TypeKey, string> = {
  "terrainType:ocean": "/textures/normals/sand.png",
  "terrainType:sea": "/textures/normals/sand.png",
  "terrainType:coast": "/textures/normals/sand.png",
  "terrainType:lake": "/textures/normals/sand.png",
  "terrainType:majorRiver": "/textures/normals/sand.png",
  "terrainType:desert": "/textures/normals/sand.png",

  "terrainType:tundra": "/textures/normals/grass.png",
  "terrainType:grass": "/textures/normals/grass.png",
  "terrainType:plains": "/textures/normals/grass.png",

  "terrainType:rocks": "/textures/normals/rock.png",
  "terrainType:snow": "/textures/normals/snow.png",
};

export const allTerrainMaterials = (scene: Scene): Record<TypeKey, StandardMaterial> => {
  const out = {} as Record<TypeKey, StandardMaterial>;
  for (const [key, color] of Object.entries(terrainColorMap) as [TypeKey, Color4][]) {
    const mat = new StandardMaterial(`mat-${key}`, scene);
    mat.diffuseColor = asColor3(color);
    mat.specularColor = Color3.Black();
    mat.bumpTexture = new Texture(terrainNormalMap[key], scene);
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

export const normalMapOf = (tile: Tile): string => terrainNormalMap[tile.terrain.key];
