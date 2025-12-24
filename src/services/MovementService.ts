import { computed, ref } from "vue";
import { Unit } from "@/objects/game/Unit";
import { Tile } from "@/objects/game/Tile";
import { roundToTenth, TypeKey } from "@/types/common";
import { MovementContext } from "./MovementContext";
import { PathStep } from "@/services/PathfinderService";
import { useMoveCostCache } from "@/composables/useMoveCostCache";
import { useObjectsStore } from "@/stores/objectStore";
import { GameKey } from "@/objects/game/_GameObject";

/**
 * MovementService handles pathfinding cost calculations for a specific Unit.
 * It caches results and uses property snapshots to avoid Vue reactivity overhead during A* searches.
 */
export class MovementService {
  // Snapshots of reactive data for peak A* performance (avoids .value access)
  unit: Unit;

  // Pre-calculated mobility (depends on design domain)
  isMobile = computed(
    () => !["domainType:air", "domainType:space"].includes(this.unit.design.value.domainKey()),
  );

  // Use computed to not need any expensive watchers or type reset
  specialTypeKeys = computed((): Set<TypeKey> => {
    const specialKeys = new Set<TypeKey>();

    // Unit.myTypes only change when Design upgrades (once every 50-100 turns)
    this.unit.myTypes.value.forEach((t) => t.specials.forEach((s) => specialKeys.add(s)));

    this.unit.player.value.knownSpecialKeys.value.forEach((s) => specialKeys.add(s));

    return specialKeys;
  });

  // Data use to walk the path
  // Set from design
  maxMoves = computed(() => this.unit.design.value.yields.getLumpAmount("yieldType:moves"));

  // Set by Unit on init/new turn
  moves = ref(0);

  // Set by Pathfinder
  path: PathStep[] = [];

  // Use global base cost cache to avoid recalculating expensive costs on every move
  // Cache key is based on unit design and player specials
  private costCache = useMoveCostCache();
  private cacheKey = computed(() =>
    this.costCache.getCacheKey(this.unit.design.value, this.specialTypeKeys.value),
  );

  constructor(unit: Unit) {
    this.unit = unit;
  }

  cost(toTile: Tile, from?: Tile, context?: MovementContext): number | TurnEnd | null {
    if (!this.isMobile.value) return null;

    const fromTile = from ?? this.unit.tile.value;

    if (context) {
      // 1. Hard Barriers (Enemy units)
      if (context.enemyUnitTiles.has(toTile.key)) return null;

      // 2. Visibility / Fog Rules
      const isKnown = context.known.has(toTile.key);
      if (!isKnown && !context.canEnterUnknownThisTurn) {
        return null;
      }
    }

    return this.baseCost(toTile, fromTile);

    // todo: include player yield mods (from moveContext)
  }

  calculateNextState(
    currentTurn: number,
    currentMoves: number,
    toTile: Tile,
    fromTile: Tile,
    context: MovementContext,
  ): NextState | null {
    // Centralized Rule: Cannot path into unknown territory on a future turn
    if (currentTurn > 0 && !context.known.has(toTile.key)) return null;

    const moveCost = this.cost(toTile, fromTile, context);
    if (moveCost === null) return null;

    let nextTurn = currentTurn;
    let nextMovesRemaining: number;
    let numericCost: number;

    if (moveCost === "turnEnd") {
      if (currentMoves <= 0) return null;
      nextMovesRemaining = 0;
      numericCost = currentMoves;
    } else if (moveCost > currentMoves && currentMoves <= 0) {
      nextTurn++;
      nextMovesRemaining = roundToTenth(this.maxMoves.value - moveCost);
      numericCost = moveCost;
    } else {
      nextMovesRemaining = roundToTenth(currentMoves - moveCost);
      numericCost = moveCost;
    }

    // Unified Turn-End friendly unit check (cannot end turn on them)
    const endsTurn = moveCost === "turnEnd" || nextMovesRemaining <= 0 || nextTurn > currentTurn;
    if (endsTurn && context.friendlyUnitTiles.has(toTile.key)) return null;

    return {
      turn: nextTurn,
      movesRemaining: Math.max(0, nextMovesRemaining),
      cost: numericCost,
    };
  }

  static getMoveContext(unit: Unit): MovementContext {
    const objectStore = useObjectsStore();
    const player = unit.player.value;

    const known = player.knownTileKeys.value;
    const visible = player.visibleTileKeys.value;

    const friendlyUnitTiles = new Set<GameKey>();
    const enemyUnitTiles = new Set<GameKey>();

    for (const u of objectStore.getClassGameObjects("unit") as Unit[]) {
      if (player.visibleTileKeys.value.has(u.tileKey.value)) {
        if (u.playerKey.value === player.key) {
          friendlyUnitTiles.add(u.tileKey.value);
        } else {
          enemyUnitTiles.add(u.tileKey.value);
        }
      }
    }

    return {
      known,
      visible,
      friendlyUnitTiles,
      enemyUnitTiles,
      canEnterUnknownThisTurn: true,
      ignoreZoc: false,
      isEmbarked:
        unit.design.value.domainKey() === "domainType:land" &&
        unit.tile.value.domain.key !== "domainType:land",
    };
  }

  move(context: MovementContext): boolean | TurnEnd {
    if (!this.isMobile.value) return false;
    if (this.path.length === 0) return this.moves.value <= 0 ? "turnEnd" : true;
    if (this.moves.value <= 0) return "turnEnd";

    // 1. Pre-calculate reachable steps
    const reachableSteps: { tile: Tile; cost: number }[] = [];
    let currentMoves = this.moves.value;
    let currentTile = this.unit.tile.value;
    let stopReason: "finished" | "outOfMoves" | "blocked" | "danger" = "finished";

    for (let i = 0; i < this.path.length; i++) {
      const step = this.path[i]!;
      const nextState = this.calculateNextState(0, currentMoves, step.tile, currentTile, context);

      if (nextState === null) {
        stopReason = "blocked";
        break;
      }

      // If the move results in a new turn, it means we spend all remaining moves to reach it this turn
      const numericCost = nextState.turn > 0 ? currentMoves : nextState.cost;
      reachableSteps.push({ tile: step.tile, cost: numericCost });
      currentMoves = nextState.turn > 0 ? 0 : nextState.movesRemaining;

      // Check for danger (ZOC) AFTER taking the step
      if (
        !context.ignoreZoc &&
        step.tile.neighborTiles.some((neighbor) => context.enemyUnitTiles.has(neighbor.key))
      ) {
        stopReason = "danger";
        break;
      }

      if (currentMoves <= 0) {
        if (i < this.path.length - 1) stopReason = "outOfMoves";
        break;
      }
      currentTile = step.tile;
    }

    // 2. Backtrack to avoid stopping on friendly units
    let actualStepCount = reachableSteps.length;
    while (actualStepCount > 0) {
      const stepTile = reachableSteps[actualStepCount - 1].tile;
      if (context.friendlyUnitTiles.has(stepTile.key)) {
        actualStepCount--;
        stopReason = "blocked";
      } else {
        break;
      }
    }

    if (actualStepCount === 0) return false;

    // 3. Actually perform the move (atomic update)
    let totalSpent = 0;
    for (let i = 0; i < actualStepCount; i++) {
      totalSpent += reachableSteps[i].cost;
    }

    // Remove from orig tile, add to new tiles
    this.unit.tile.value.unitKeys.value = this.unit.tile.value.unitKeys.value.filter(
      (key) => key !== this.unit.key,
    );
    this.unit.tileKey.value = reachableSteps[actualStepCount - 1].tile.key;
    this.unit.tile.value.unitKeys.value.push(this.unit.key);

    this.moves.value = Math.max(0, roundToTenth(this.moves.value - totalSpent));

    this.path = this.path.slice(actualStepCount);

    if (stopReason === "blocked" || stopReason === "danger") return false;
    return this.moves.value <= 0 ? "turnEnd" : true;
  }

  // NOTE: Keep in-sync with keys used in useMoveCostCache.getRelevantSpecialKeys()
  private baseCost(to: Tile, from: Tile): number | TurnEnd | null {
    // Return from cache if it's there
    const cached = this.getCachedCost(to, from);
    if (cached !== undefined) return cached;

    const myDomainKey = this.unit.design.value.domainKey();
    const toFeatureKey = to.feature.value?.key;

    // 1. Domain Constraints
    // Water units on land: only if City or Canal
    if (myDomainKey === "domainType:water" && to.domain.id !== "water") {
      if (!to.cityKey.value && to.construction.value?.type.key !== "improvementType:canal") {
        return null;
      }
    }

    // Land units in water: needs "Embark" special
    if (myDomainKey === "domainType:land" && to.domain.id === "water") {
      if (!this.specialTypeKeys.value.has("specialType:canEmbark")) {
        return null;
      }
    }

    // 2. Terrain / Feature / Elevation Specials
    if (to.terrain.key === "terrainType:sea") {
      if (!this.specialTypeKeys.value.has("specialType:canEnterSea")) return null;
    }
    if (to.terrain.key === "terrainType:ocean") {
      if (!this.specialTypeKeys.value.has("specialType:canEnterOcean")) return null;
    }
    if (toFeatureKey === "featureType:ice") {
      if (!this.specialTypeKeys.value.has("specialType:canEnterIce")) return null;
    }
    if (
      to.elevation.key === "elevationType:mountain" ||
      to.elevation.key === "elevationType:snowMountain"
    ) {
      if (!this.specialTypeKeys.value.has("specialType:canEnterMountains")) return null;
    }

    // 3. Turn-ending Moves
    // Switching domains (Land unit embarking/disembarking; Water unit entering/leaving canal/city)
    if (from.domain.key !== to.domain.key) {
      // todo: check bridges
      return "turnEnd";
    }

    // Entering a minor river for land units
    if (myDomainKey === "domainType:land") {
      if (to.riverKey && !from.riverKey) {
        // todo: check bridges
        return "turnEnd";
      }
    }

    // Entering a swamp
    if (toFeatureKey === "featureType:swamp") {
      return "turnEnd";
    }

    // 4. Cost
    let cost = 1;

    // Difficult Terrain
    if (to.terrain.key === "terrainType:desert" || to.terrain.key === "terrainType:snow") {
      cost += 1;
    }

    // Any elevation
    if (to.elevation.key !== "elevationType:flat") {
      cost += 1;
    }

    // Dense features
    if (
      toFeatureKey === "featureType:forest" ||
      toFeatureKey === "featureType:pineForest" ||
      toFeatureKey === "featureType:jungle" ||
      toFeatureKey === "featureType:kelp" ||
      toFeatureKey === "featureType:atoll" ||
      toFeatureKey === "featureType:lagoon"
    ) {
      cost += 1;
    }

    // Trade Wind
    if (toFeatureKey === "featureType:tradeWind") {
      cost -= 0.5;
    }

    cost = roundToTenth(cost);

    // Set to cache before returning
    this.setCachedCost(to, from, cost);

    return cost;
  }

  private getCachedCost(to: Tile, from: Tile): number | TurnEnd | null | undefined {
    return this.costCache.getMoveCost(this.cacheKey.value, from.key, to.key);
  }

  private setCachedCost(to: Tile, from: Tile, cost: number | TurnEnd | null) {
    return this.costCache.setMoveCost(this.cacheKey.value, from.key, to.key, cost);
  }
}

export type TurnEnd = "turnEnd";

export type NextState = { turn: number; movesRemaining: number; cost: number };
