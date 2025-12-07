import { Color3, Scene, StandardMaterial } from "@babylonjs/core";
import { TypeKey } from "@/types/common";

const colors = {
  coast: Color3.FromHexString("#1e5f8a"), // todo use central color helper
  desert: Color3.FromHexString("#b3a500"), // todo use central color helper
  grass: Color3.FromHexString("#3f6212"), // todo use central color helper
  lake: Color3.FromHexString("#164e63"), // todo use central color helper
  majorRiver: Color3.FromHexString("#204b4c"), // todo use central color helper
  ocean: Color3.FromHexString("#172554"), // todo use central color helper
  plains: Color3.FromHexString("#a58111"), // todo use central color helper
  sea: Color3.FromHexString("#1e3a8a"), // todo use central color helper
  snow: Color3.FromHexString("#a0a0a0"), // todo use central color helper
  tundra: Color3.FromHexString("#3e5234"), // todo use central color helper
} as Record<string, Color3>;

export const allTerrainMaterials = (scene: Scene): Record<TypeKey, StandardMaterial> => {
  return {
    "terrainType:coast": coast(scene),
    "terrainType:desert": desert(scene),
    "terrainType:grass": grass(scene),
    "terrainType:lake": lake(scene),
    "terrainType:majorRiver": majorRiver(scene),
    "terrainType:ocean": ocean(scene),
    "terrainType:plains": plains(scene),
    "terrainType:sea": sea(scene),
    "terrainType:snow": snow(scene),
    "terrainType:tundra": tundra(scene),
  };
};

export const coast = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-coast`, scene);
  mat.diffuseColor = colors["coast"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const desert = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-desert`, scene);
  mat.diffuseColor = colors["desert"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const grass = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-grass`, scene);
  mat.diffuseColor = colors["grass"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const lake = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-lake`, scene);
  mat.diffuseColor = colors["lake"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const majorRiver = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-majorRiver`, scene);
  mat.diffuseColor = colors["majorRiver"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const ocean = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-ocean`, scene);
  mat.diffuseColor = colors["ocean"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const plains = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-plains`, scene);
  mat.diffuseColor = colors["plains"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const sea = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-sea`, scene);
  mat.diffuseColor = colors["sea"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const snow = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-snow`, scene);
  mat.diffuseColor = colors["snow"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const tundra = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-tundra`, scene);
  mat.diffuseColor = colors["tundra"];
  mat.specularColor = Color3.Black();
  return mat;
};
