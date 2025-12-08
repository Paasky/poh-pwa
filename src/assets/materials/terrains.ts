import { Color3, Scene, StandardMaterial } from "@babylonjs/core";
import { TypeKey } from "@/types/common";

export const terrainColorMap: Record<TypeKey, Color3> = {
  "terrainType:coast": Color3.FromHexString("#1e5f8a"),
  "terrainType:desert": Color3.FromHexString("#b3a500"),
  "terrainType:grass": Color3.FromHexString("#3f6212"),
  "terrainType:lake": Color3.FromHexString("#164e63"),
  "terrainType:majorRiver": Color3.FromHexString("#204b4c"),
  "terrainType:ocean": Color3.FromHexString("#172554"),
  "terrainType:plains": Color3.FromHexString("#a58111"),
  "terrainType:sea": Color3.FromHexString("#1e3a8a"),
  "terrainType:snow": Color3.FromHexString("#a0a0a0"),
  "terrainType:rocks": Color3.FromHexString("#333333"),
  "terrainType:tundra": Color3.FromHexString("#3e5234"),
};

export const allTerrainMaterials = (scene: Scene): Record<TypeKey, StandardMaterial> => {
  const out = {} as Record<TypeKey, StandardMaterial>;
  for (const [key, color] of Object.entries(terrainColorMap) as [TypeKey, Color3][]) {
    const mat = new StandardMaterial(`mat-${key}`, scene);
    mat.diffuseColor = color;
    mat.specularColor = Color3.Black();
    out[key] = mat;
  }
  return out;
};
