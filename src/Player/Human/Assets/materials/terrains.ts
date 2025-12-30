import { Color3, Color4, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import { TypeKey } from "@/Common/Objects/Common";
import { Tile } from "@/Common/Models/Tile";
import { EngineColors, toColor4 } from "@/Player/Human/EngineStyles";

export const terrainColorMap: Record<TypeKey, Color4> = {
  "terrainType:coast": toColor4(EngineColors.terrain.coast),
  "terrainType:desert": toColor4(EngineColors.terrain.desert),
  "terrainType:grass": toColor4(EngineColors.terrain.grass),
  "terrainType:lake": toColor4(EngineColors.terrain.lake),
  "terrainType:majorRiver": toColor4(EngineColors.terrain.majorRiver),
  "terrainType:ocean": toColor4(EngineColors.terrain.ocean),
  "terrainType:plains": toColor4(EngineColors.terrain.plains),
  "terrainType:sea": toColor4(EngineColors.terrain.sea),
  "terrainType:snow": toColor4(EngineColors.terrain.snow),
  "terrainType:rocks": toColor4(EngineColors.terrain.rocks),
  "terrainType:tundra": toColor4(EngineColors.terrain.tundra),
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
