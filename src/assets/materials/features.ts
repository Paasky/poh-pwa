import { Color3, Scene, StandardMaterial } from "@babylonjs/core";

const colors = {
  atoll: Color3.FromHexString("#407e5c"),
  floodPlain: Color3.FromHexString("#8b7355"),
  forest: Color3.FromHexString("#2d5016"),
  ice: Color3.FromHexString("#e0f4ff"),
  jungle: Color3.FromHexString("#174e2c"),
  kelp: Color3.FromHexString("#205542"),
  lagoon: Color3.FromHexString("#5dade2"),
  oasis: Color3.FromHexString("#52b788"),
  pineForest: Color3.FromHexString("#00450c"),
  shrubs: Color3.FromHexString("#6b8e23"),
  swamp: Color3.FromHexString("#4a5d23"),
  tradeWind: Color3.FromHexString("#272993"),
} as Record<string, Color3>;

export const atoll = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-atoll`, scene);
  mat.diffuseColor = colors["atoll"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const floodPlain = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-floodPlain`, scene);
  mat.diffuseColor = colors["floodPlain"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const forest = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-forest`, scene);
  mat.diffuseColor = colors["forest"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const ice = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-ice`, scene);
  mat.diffuseColor = colors["ice"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const jungle = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-jungle`, scene);
  mat.diffuseColor = colors["jungle"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const kelp = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-kelp`, scene);
  mat.diffuseColor = colors["kelp"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const lagoon = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-lagoon`, scene);
  mat.diffuseColor = colors["lagoon"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const oasis = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-oasis`, scene);
  mat.diffuseColor = colors["oasis"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const pineForest = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-pineForest`, scene);
  mat.diffuseColor = colors["pineForest"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const shrubs = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-shrubs`, scene);
  mat.diffuseColor = colors["shrubs"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const swamp = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-swamp`, scene);
  mat.diffuseColor = colors["swamp"];
  mat.specularColor = Color3.Black();
  return mat;
};

export const tradeWind = (scene: Scene): StandardMaterial => {
  const mat = new StandardMaterial(`mat-tradeWind`, scene);
  mat.diffuseColor = colors["tradeWind"];
  mat.specularColor = Color3.Black();
  return mat;
};
