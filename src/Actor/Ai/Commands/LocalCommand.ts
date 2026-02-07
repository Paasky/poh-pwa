import { Player } from "@/Common/Models/Player";
import {
  ActionReport,
  CanActResponse,
  Difficulty,
  Locality,
  MapAction,
  Note,
  Priority,
} from "@/Actor/Ai/AiTypes";
import { Attack, PohAction } from "@/Common/PohAction";
import { Unit } from "@/Common/Models/Unit";
import { City } from "@/Common/Models/City";
import { useDataBucket } from "@/Data/useDataBucket";
import { Construction } from "@/Common/Models/Construction";
import { Tile } from "@/Common/Models/Tile";
import { has } from "@/Common/Helpers/collectionTools";
import {
  chooseAttackTarget,
  chooseBombardTarget,
  chooseMoveTo,
} from "@/Actor/Ai/Deductors/ChooseTarget";
import { setToConstruct, setToTrain } from "@/Actor/Ai/Deductors/ChooseQueueItem";

export class LocalCommand {
  private turn = useDataBucket().world.turn;
  private now = Date.now();

  private actions = [] as PohAction[];
  private notes = [] as Note[];

  constructor(
    public readonly player: Player,
    public readonly difficulty: Difficulty,
    public readonly locality: Locality,
  ) {}

  canAct(localPriorities: Priority[]): CanActResponse {
    const cities: City[] = [];
    const units: Unit[] = [];
    const idleUnits: Unit[] = [];
    const idleCities: City[] = [];
    const idleUnitTiles = new Set<Tile>();

    for (const tile of this.locality.tiles) {
      if (tile.city?.playerKey === this.player.key) {
        cities.push(tile.city);
        if (!tile.city.constructionQueue.items[0] && !tile.city.trainingQueue.items[0]) {
          idleCities.push(tile.city);
        }
      }
      for (const unit of tile.units) {
        if (unit.playerKey === this.player.key) {
          units.push(unit);
          if (!this.canAttack(unit) && !this.canBombard(unit) && !this.canMove(unit)) {
            idleUnits.push(unit);
            idleUnitTiles.add(tile);
          }
        }
      }
    }

    const canActPriorities: Priority[] = [];
    const limitedPriorities: Priority[] = [];
    const cannotActPriorities: Priority[] = [];

    if (cities.length === 0 && units.length === 0) {
      return {
        areaId: this.locality.id,
        areaName: this.locality.name,
        status: "unable",
        canActPriorities: [],
        limitedPriorities: [],
        cannotActPriorities: localPriorities,
        availableUnits: 0,
        availableCities: 0,
        idleUnits: 0,
        idleCities: 0,
        idleUnitTiles: new Set(),
        reasoning: "No units or cities in locality",
      };
    }

    for (const priority of localPriorities) {
      const evaluation = this.evaluatePriority(priority, cities, units);

      if (evaluation.canAct) {
        canActPriorities.push(priority);
      } else if (evaluation.partial) {
        limitedPriorities.push(priority);
      } else {
        cannotActPriorities.push(priority);
      }
    }

    let status: "ready" | "limited" | "unable";
    if (canActPriorities.length > 0) {
      status = "ready";
    } else if (limitedPriorities.length > 0) {
      status = "limited";
    } else {
      status = "unable";
    }

    return {
      areaId: this.locality.id,
      areaName: this.locality.name,
      status,
      canActPriorities,
      limitedPriorities,
      cannotActPriorities,
      availableUnits: units.length,
      availableCities: cities.length,
      idleUnits: idleUnits.length,
      idleCities: idleCities.length,
      idleUnitTiles,
    };
  }

  private evaluatePriority(
    priority: Priority,
    cities: City[],
    units: Unit[],
  ): { canAct: boolean; partial: boolean } {
    const capableCities = cities.filter((c) => this.isPriorityFor(priority, c));
    const capableUnits = units.filter((u) => this.isPriorityFor(priority, u));

    if (priority.cityAction && capableCities.length === 0) {
      return { canAct: false, partial: false };
    }

    if (priority.mapAction) {
      const actionableUnits = capableUnits.filter((u) => {
        if (priority.mapAction === "explore" || priority.mapAction === "settle") {
          return this.canMove(u);
        }
        if (priority.mapAction === "attack" || priority.mapAction === "posture") {
          return this.canAttack(u) || this.canBombard(u);
        }
        return true;
      });

      if (actionableUnits.length === 0 && capableCities.length === 0) {
        return { canAct: false, partial: false };
      }

      if (actionableUnits.length < capableUnits.length) {
        return { canAct: true, partial: true };
      }
    }

    return { canAct: true, partial: false };
  }

  act(localPriorities: Priority[]): ActionReport {
    this.turn = useDataBucket().world.turn;
    this.now = Date.now();
    this.actions = [];
    this.notes = [];

    const cities = [] as City[];
    const units = [] as Unit[];
    for (const tile of this.locality.tiles) {
      if (tile.city?.playerKey === this.player.key) {
        cities.push(tile.city);
      }
      for (const unit of tile.units) {
        if (unit.playerKey === this.player.key) {
          units.push(unit);
        }
      }
    }

    // Nothing to control -> return empty report
    if (!cities.length && !units.length) return { actions: [], notes: [] };

    // Sort priorities: importance first, then main emphasis
    const priorities = [...localPriorities].sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return b.emphases[0].value - a.emphases[0].value;
    });

    for (const city of cities) {
      this.createCityActions(priorities, city);
    }
    for (const unit of units) {
      this.createUnitActions(priorities, unit);
    }

    return { actions: this.actions, notes: this.notes };
  }

  private createCityActions(priorities: Priority[], city: City): void {
    let hasBombardAction = false;
    let hasConstructAction = false;
    let hasTrainAction = false;

    for (const priority of priorities) {
      if (!this.isPriorityFor(priority, city)) continue;

      if (!hasBombardAction && priority.mapAction === "attack") {
        this.actions.push(this.bombardAction(city, chooseBombardTarget(city, priority)));
        hasBombardAction = true;
      }

      if (
        !hasConstructAction &&
        priority.targetRequires?.isSatisfied(
          new Set([
            useDataBucket().getType("conceptType:buildingType"),
            useDataBucket().getType("conceptType:nationalWonderType"),
            useDataBucket().getType("conceptType:worldWonderType"),
          ]),
        )
      ) {
        const constructActions = setToConstruct(city);
        if (constructActions.length) {
          this.actions.push(...constructActions);
          hasConstructAction = true;
        }
      }

      if (
        !hasTrainAction &&
        priority.targetRequires?.isSatisfied(
          new Set([useDataBucket().getType("conceptType:unitDesign")]),
        )
      ) {
        const trainActions = setToTrain(city, priority);
        if (trainActions.length) {
          this.actions.push(...trainActions);
          hasTrainAction = true;
        }
      }
    }

    if (!hasBombardAction && this.canBombard(city)) {
      this.actions.push(this.bombardAction(city, chooseBombardTarget(city)));
    }

    if (!hasConstructAction && !city.constructionQueue.items[0]) {
      const constructActions = setToConstruct(city);
      if (constructActions.length) {
        this.actions.push(...constructActions);
      } else {
        this.notes.push({
          name: `${city.name} is not constructing anything`,
          importance: 4,
          emphasis: {
            category: "gain",
            value: 50,
            reasons: [
              {
                type: "emptyQueue",
                value: 50,
                gameKeys: [city.key],
              },
            ],
          },
        });
      }
    }

    if (!hasTrainAction && !city.trainingQueue.items[0]) {
      const trainActions = setToTrain(city);
      if (trainActions.length) {
        this.actions.push(...trainActions);
      } else {
        this.notes.push({
          name: `${city.name} is not training anything`,
          importance: 4,
          emphasis: {
            category: "gain",
            value: 50,
            reasons: [
              {
                type: "emptyQueue",
                value: 50,
                gameKeys: [city.key],
              },
            ],
          },
        });
      }
    }
  }

  private createUnitActions(priorities: Priority[], unit: Unit): void {
    let hasAction = false;

    const attackActions: MapAction[] = ["attack", "posture", "reinforce"];
    const bombardActions: MapAction[] = ["attack", "defend", "posture", "reinforce"];

    for (const priority of priorities) {
      if (!this.isPriorityFor(priority, unit)) continue;

      if (bombardActions.includes(priority.mapAction!) && this.canBombard(unit)) {
        this.actions.push(this.bombardAction(unit, chooseBombardTarget(unit, priority)));
        hasAction = true;
        break;
      }

      if (attackActions.includes(priority.mapAction!) && this.canAttack(unit)) {
        this.actions.push(this.attackAction(unit, chooseAttackTarget(unit, priority)));
        hasAction = true;
        break;
      }

      if (priority.mapAction === "explore" && this.canMove(unit)) {
        this.actions.push(this.moveAction(unit, chooseMoveTo(unit, priority)));
        hasAction = true;
        break;
      }
    }

    if (hasAction) return;

    // Bombard before Attack
    if (this.canBombard(unit)) {
      this.actions.push(this.bombardAction(unit, chooseBombardTarget(unit)));
      return;
    }

    // Attack before Move
    if (this.canAttack(unit)) {
      this.actions.push(this.attackAction(unit, chooseAttackTarget(unit)));
      return;
    }

    if (this.canMove(unit)) {
      this.actions.push(this.moveAction(unit, chooseMoveTo(unit)));
      return;
    }

    // Nothing to do: Skip Turn
    this.actions.push(this.skipAction(unit));
    this.notes.push({
      name: `${unit.name} skipped the turn`,
      importance: 4,
      emphasis: {
        category: "capability",
        value: 50,
        reasons: [
          {
            type: "idleUnit",
            value: 50,
            gameKeys: [unit.key],
          },
        ],
      },
    });
  }

  private isPriorityFor(priority: Priority, object: City | Unit): boolean {
    return (
      !priority.requires ||
      priority.requires.isSatisfied(new Set([...object.types, ...object.availableActions]))
    );
  }

  private canAttack(unit: Unit): boolean {
    return has(unit.availableActions, (action) => action.key === "actionType:attack");
  }

  private canBombard(object: City | Unit): boolean {
    return has(object.availableActions, (action) => action.key === "actionType:bombard");
  }

  private canMove(unit: Unit): boolean {
    return has(unit.availableActions, (action) => action.key === "actionType:move");
  }

  private attackAction(unit: Unit, target: City | Construction | Tile | Unit): Attack {
    return {
      type: "actionType:attack",
      unitKey: unit.key,
      targetKey: target.key,
      turn: this.turn,
      timestamp: this.now,
    } as Attack;
  }

  private bombardAction(object: City | Unit, target: City | Construction | Tile | Unit): PohAction {
    return {
      type: "actionType:bombard",
      [object instanceof City ? "cityKey" : "unitKey"]: object.key,
      targetKey: target.key,
      turn: this.turn,
      timestamp: this.now,
    };
  }

  private moveAction(object: City | Unit, tile: Tile): PohAction {
    return {
      type: "actionType:move",
      unitKey: object.key,
      targetKey: tile.key,
      turn: this.turn,
      timestamp: this.now,
    };
  }

  private skipAction(object: City | Unit): PohAction {
    return {
      type: "actionType:skipTurn",
      unitKey: object.key,
      turn: this.turn,
      timestamp: this.now,
    };
  }
}
