import { RawSaveData } from "@/Data/DataBucket";
import { GameKey, IRawGameObject } from "@/Common/Models/_GameTypes";
import { worldSizes } from "@/factories/worldFactory";

export const SAVE_PREFIX = "poh.save.";
export const INDEX_KEY = "poh.saves.index";

export interface PlayerMeta {
  name: string;
  culture: string;
  isMet: boolean;
}

export interface SaveMeta {
  id: string; // World ID
  name: string;
  time: number;
  version: string;
  turn: number;
  year: number;
  worldSize: string;
  players: PlayerMeta[];
}

interface IRawPlayer extends IRawGameObject {
  cultureKey: GameKey;
  knownPlayerKeys?: GameKey[];
}

interface IRawCulture extends IRawGameObject {
  name: string;
  leader: { name: string };
}

export const saveManager = {
  // Handles both writing the blob and updating the 'poh.saves.index'
  save(data: RawSaveData, isAutosave = false) {
    if (isAutosave && !data.name.endsWith(" [auto]")) data.name += " [auto]";
    localStorage.setItem(`${SAVE_PREFIX}${data.world.id}`, JSON.stringify(data));
    this._updateIndex(data);
  },

  // Load must throw on invalid keys to ensure centralized error handling
  load(id: string): RawSaveData {
    const raw = localStorage.getItem(`${SAVE_PREFIX}${id}`);
    if (!raw) throw new Error(`Save game with ID '${id}' not found in Local Storage.`);
    return JSON.parse(raw) as RawSaveData;
  },

  delete(id: string) {
    localStorage.removeItem(`${SAVE_PREFIX}${id}`);
    const index = this.getIndex();
    const newIndex = index.filter((s) => s.id !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));
  },

  getLatest(): SaveMeta | undefined {
    return this.getIndex().sort((a, b) => b.time - a.time)[0];
  },

  getIndex(): SaveMeta[] {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as SaveMeta[]) : [];
  },

  _updateIndex(data: RawSaveData) {
    const index = this.getIndex();

    // Extract player metadata
    const currentPlayerKey = data.world.currentPlayer;
    const rawPlayers = data.objects.filter((o) => o.key.startsWith("player:")) as IRawPlayer[];
    const rawCultures = data.objects.filter((o) => o.key.startsWith("culture:")) as IRawCulture[];

    // Find current player to see who they know
    const currentPlayer = rawPlayers.find((p) => p.key === currentPlayerKey);
    const knownPlayerKeys = new Set(currentPlayer?.knownPlayerKeys || []);

    const players: PlayerMeta[] = rawPlayers.map((p) => {
      const isMet = p.key === currentPlayerKey || knownPlayerKeys.has(p.key);
      const culture = rawCultures.find((c) => c.key === p.cultureKey);

      return {
        name: isMet ? culture?.leader?.name || "Unknown" : "Unmet",
        culture: isMet ? culture?.name || "Unknown" : "Unmet",
        isMet,
      };
    });

    const matchedSize = worldSizes.find(
      (s) => s.x === data.world.size.x && s.y === data.world.size.y,
    );
    const worldSize = matchedSize?.name ?? `Custom (${data.world.size.y} x ${data.world.size.x})`;

    const meta: SaveMeta = {
      id: data.world.id,
      name: data.name,
      time: data.time,
      version: data.version,
      turn: data.world.turn,
      year: data.world.year,
      worldSize,
      players,
    };

    const existingIndex = index.findIndex((s) => s.id === meta.id);
    if (existingIndex !== -1) {
      index[existingIndex] = meta;
    } else {
      index.push(meta);
    }
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  },
};
