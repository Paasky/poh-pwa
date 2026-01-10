import { TypeClass } from "@/Common/Objects/TypeObject";
import { Yield, Yields } from "@/Common/Static/Yields";
import { CatKey, roundToTenth, TypeKey } from "@/Common/Objects/Common";
import { TypeStorage } from "@/Common/Objects/TypeStorage";
import { Construction } from "@/Common/Models/Construction";
import { UnitDesign } from "@/Common/Models/UnitDesign";

export abstract class QueueItem {
  item: Construction | UnitDesign;
  progress = 0;
  cost: number;

  get remaining(): number {
    return this.cost - this.progress;
  }

  protected constructor(item: Construction | UnitDesign, cost: number) {
    this.item = item;
    this.cost = cost;
  }
}

export class ConstructionQueueItem extends QueueItem {
  constructor(item: Construction) {
    super(item, item.type.productionCost!);
  }
}

export class TrainingQueueItem extends QueueItem {
  constructor(design: UnitDesign) {
    super(design, design.productionCost);
  }
}

export abstract class Queue {
  protected _items: QueueItem[] = [];
  primaryYieldKey: TypeKey;
  secondaryYieldKey: TypeKey;

  protected constructor(primaryYieldKey: TypeKey, secondaryYieldKey: TypeKey) {
    this.primaryYieldKey = primaryYieldKey;
    this.secondaryYieldKey = secondaryYieldKey;
  }

  get items(): QueueItem[] {
    return this._items.slice();
  }

  // Returns overflow, if any
  addProgress(amount: number): number {
    const queueItem = this._items[0];
    if (!queueItem) throw new Error("Nothing in the queue to add progress to.");

    // If progress + amount < cost, just add progress and return 0
    if (queueItem.progress + amount < queueItem.cost) {
      queueItem.progress = roundToTenth(queueItem.progress + amount);
      return 0;
    }

    // Otherwise, set progress to cost and return overflow
    const overflow = roundToTenth(queueItem.progress + amount - queueItem.cost);
    queueItem.progress = queueItem.cost;
    return overflow;
  }

  remove(index: number) {
    this._items.splice(index, 1);
  }

  reorder(index: number, newIndex: number) {
    this._items.splice(newIndex, 0, this._items.splice(index, 1)[0]);
  }

  /**
   * Start a turn for this queue. Returns the Obj that was completed, or null if none.
   * @param myProduction  Share of the city's turn start production for this queue
   * @param cityYields    City's turn start yields *without production*. Note: prod overflow will be added to this storage.
   * @param cityYieldMods Yield mods at the city's turn start
   */
  startTurn(
    myProduction: Yield,
    cityYields: TypeStorage,
    cityYieldMods: Yields,
  ): Construction | UnitDesign | null {
    const queueItem = this._items[0];

    // Nothing to construct: Convert my prod to primary/secondary yields and return null
    if (!queueItem) {
      cityYields.add(this.primaryYieldKey, roundToTenth(myProduction.amount / 2));
      cityYields.add(this.secondaryYieldKey, roundToTenth(myProduction.amount / 2));
      return null;
    }

    // Use half of the primary yield to supplement production
    const amount = roundToTenth(cityYields.amount(this.primaryYieldKey) / 2);
    if (amount > 0) cityYields.take(this.primaryYieldKey, amount);
    const extraYield =
      amount > 0
        ? ({
            type: this.primaryYieldKey,
            amount: amount,
            method: "lump",
            for: [],
            vs: [],
          } as Yield)
        : null;

    // Add and apply modifiers
    const forObjs =
      queueItem.item.class === "construction"
        ? [(queueItem.item as Construction).type]
        : (queueItem.item as UnitDesign).types;

    const turnYields = cityYieldMods
      .only(["yieldType:production"], forObjs)
      .add(...([myProduction, extraYield].filter(Boolean) as Yield[]))
      .flatten();

    let total = 0;
    for (const y of turnYields.all()) {
      total += y.amount;
    }

    // Only allow the current item to complete, all else goes to overflow
    const overflow = this.addProgress(total);
    if (queueItem.remaining <= 0) {
      if (overflow > 0) cityYields.add("yieldType:production", overflow);
      this.remove(0);
      return queueItem.item;
    }
    return null;
  }
}

export class ConstructionQueue extends Queue {
  constructor() {
    super("yieldType:gold", "yieldType:happiness");
  }

  add(item: Construction) {
    this._items.push(new ConstructionQueueItem(item));
  }

  get purchaseCost(): Yield | null {
    if (this._items.length === 0) return null;

    const queueItem = this._items[0] as ConstructionQueueItem;
    const typeClass = (queueItem.item as unknown as Construction).type.class! as TypeClass;

    // National or WorldState Wonder -> null
    if (typeClass === "nationalWonderType" || typeClass === "worldWonderType") return null;

    // Buildings -> remaining productionCost in Gold * 2
    return {
      type: "yieldType:gold",
      amount: roundToTenth(queueItem.remaining * 2),
      method: "lump",
      for: [],
      vs: [],
    };
  }
}

export class TrainingQueue extends Queue {
  constructor() {
    super("yieldType:food", "yieldType:order");
  }

  add(design: UnitDesign) {
    this._items.push(new TrainingQueueItem(design));
  }

  get purchaseCost(): Yield | null {
    if (this._items.length === 0) return null;

    const queueItem = this._items[0] as TrainingQueueItem;
    const equipmentCategory = (queueItem.item as unknown as UnitDesign).equipment
      .category! as CatKey;

    // Missionary -> remaining productionCost * 2 in Faith
    if (equipmentCategory === "equipmentCategory:missionary") {
      return {
        type: "yieldType:faith",
        amount: roundToTenth(queueItem.remaining * 2),
        method: "lump",
        for: [],
        vs: [],
      };
    }

    // Diplomat/Spy -> remaining productionCost * 2 in Influence
    if (
      equipmentCategory === "equipmentCategory:diplomat" ||
      equipmentCategory === "equipmentCategory:spy"
    ) {
      return {
        type: "yieldType:influence",
        amount: roundToTenth(queueItem.remaining * 2),
        method: "lump",
        for: [],
        vs: [],
      };
    }

    // Worker/Settler -> remaining productionCost * 2 in Culture
    if (
      equipmentCategory === "equipmentCategory:worker" ||
      equipmentCategory === "equipmentCategory:settler"
    ) {
      return {
        type: "yieldType:culture",
        amount: roundToTenth(queueItem.remaining * 2),
        method: "lump",
        for: [],
        vs: [],
      };
    }

    // Other -> remaining productionCost * 2 in Gold
    return {
      type: "yieldType:gold",
      amount: roundToTenth(queueItem.remaining * 2),
      method: "lump",
      for: [],
      vs: [],
    };
  }
}
