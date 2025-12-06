import { Tile } from "@/objects/game/Tile";
import { Player } from "@/objects/game/Player";
import { useObjectsStore } from "@/stores/objectStore";
import { type Coords } from "@/factories/TerraGenerator/helpers/neighbors";
import type { GameKey } from "@/objects/game/_GameObject";
import type { WorldState } from "@/types/common";
import { computed, markRaw } from "vue";

/*
World (engine/game model)

Purpose
- A lightweight, engine-facing view of the world that stores keys only and
  resolves concrete objects (Tiles/Players) lazily via the object store.
- Keeps the rendering/engine layer decoupled from the Pinia store’s DTO.

Distinct from WorldState (store DTO)
- WorldState (in types/common.ts) is a plain serializable struct kept in Pinia.
- This World class is for the engine/logic that sit outside the store.

Construction
- Prefer using `World.fromWorldState(...)` to build this class from the store.
*/
export class World {
  // Identity and global state
  id: string;
  size: Coords; // { x: sizeX, y: sizeY }
  turn: number;
  year: number;
  currentPlayer: GameKey;

  // Keys-only containers (decouples from heavy store graphs)
  tileKeys: GameKey[];
  aiPlayerKeys: GameKey[];
  humanPlayerKeys: GameKey[];

  // Store access (marked raw to avoid Vue proxying in case this leaks to reactive context)
  objStore: ReturnType<typeof useObjectsStore>;

  constructor(params: {
    id: string;
    size: Coords;
    turn: number;
    year: number;
    currentPlayer: GameKey;
    tileKeys: GameKey[];
    aiPlayerKeys: GameKey[];
    humanPlayerKeys: GameKey[];
  }) {
    this.id = params.id;
    this.size = params.size;
    this.turn = params.turn;
    this.year = params.year;
    this.currentPlayer = params.currentPlayer;

    this.tileKeys = params.tileKeys;
    this.aiPlayerKeys = params.aiPlayerKeys;
    this.humanPlayerKeys = params.humanPlayerKeys;

    // Note: keep a direct store ref, but markRaw if it’s ever exposed reactively
    this.objStore = markRaw(useObjectsStore());
  }

  // Convenience accessors
  get sizeX(): number {
    return this.size.x;
  }
  get sizeY(): number {
    return this.size.y;
  }

  // Lazy resolvers
  get tiles(): Tile[] {
    const store = this.objStore;
    return this.tileKeys
      .map((k) => store.get(k))
      .filter(Boolean)
      .map((o) => o as Tile);
  }

  get aiPlayers(): Player[] {
    const store = this.objStore;
    return this.aiPlayerKeys
      .map((k) => store.get(k))
      .filter(Boolean)
      .map((o) => o as Player);
  }

  get humanPlayers(): Player[] {
    const store = this.objStore;
    return this.humanPlayerKeys
      .map((k) => store.get(k))
      .filter(Boolean)
      .map((o) => o as Player);
  }

  // Factory: build an Engine World from a store WorldState
  static fromWorldState(
    state: WorldState,
    args: {
      tileKeys: GameKey[];
      aiPlayerKeys: GameKey[];
      humanPlayerKeys: GameKey[];
    },
  ): World {
    return new World({
      id: state.id,
      size: { x: state.sizeX, y: state.sizeY },
      turn: state.turn,
      year: state.year,
      currentPlayer: state.currentPlayer,
      tileKeys: args.tileKeys,
      aiPlayerKeys: args.aiPlayerKeys,
      humanPlayerKeys: args.humanPlayerKeys,
    });
  }
}
