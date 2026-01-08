import { Tile } from "@/Common/Models/Tile";

export type Difficulty = "Easy"|"Regular"|"Hard"|"Brutal"

export type Note = {
  forId: string;
}

export type Priority = {}

export type Locality = {
  id: string;
  name: string;
  tiles: Set<Tile>;
}

export type Region = {
  id: string;
  name: string;
  localities: Set<Locality>;
}