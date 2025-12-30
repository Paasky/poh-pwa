import { GameData } from "@/types/api";
import { useDataBucket } from "@/Data/useDataBucket";
import { useEventStore } from "@/stores/eventStore";
import { getRandom } from "@/helpers/arrayTools";
import { Construction } from "@/Common/Models/Construction";
import { Player } from "@/Common/Models/Player";
import { asyncProcess } from "@/helpers/asyncProcess";

export class GameManager {
  eventStore: ReturnType<typeof useEventStore>;
  bucket: ReturnType<typeof useDataBucket>;
  turnProgress: (step: string, progress: number | true) => void;

  // progress = 0-100 as percent, true = ready
  constructor(turnProgress: (step: string, progress: number | true) => void) {
    this.eventStore = useEventStore();
    this.bucket = useDataBucket();
    this.turnProgress = turnProgress;
  }

  save(): GameData {
    return {
      objects: Object.values(this.bucket._gameObjects),
      world: this.bucket.world,
    };
  }

  async startTurn(): Promise<this> {
    const players = this.bucket.getClassGameObjects("player") as Player[];
    const stepCount = players.length + 4;
    let step = 0;

    await asyncProcess(players, (player) => {
      step++;
      this.turnProgress(player.name, Math.round((step / stepCount) * 100));
      player.startTurn();
    });

    // Per Wonder type, Select one random winner to complete the wonder (if completed on the same turn in multiple cities)

    this.turnProgress("World Wonders", Math.round((step / stepCount) * 100));
    for (const constructions of Object.values(this.eventStore.readyWonders)) {
      const winner = getRandom(constructions);
      winner.complete(winner.city.value!.player.value);

      this.bucket.getClassObjects<Construction>("construction").forEach((construction) => {
        if (construction.type.key === winner.type.key && construction.key !== winner.key) {
          construction.cancel(construction.city.value!.player.value, true);
        }
      });
    }
    step++;

    // Complete all new Construction/Citizens/Units

    this.turnProgress("Citizens", Math.round((step / stepCount) * 100));
    this.eventStore.readyCitizens.forEach((citizen) => {
      citizen.complete();
    });
    step++;

    this.turnProgress("Construction", Math.round((step / stepCount) * 100));
    this.eventStore.readyConstructions.forEach((construction) => {
      // Must have either a city or a unit to complete it
      const player = construction.city?.player.value ?? construction.tile.units.value[0]!.player;

      construction.complete(player);
    });
    step++;

    this.turnProgress("Training", Math.round((step / stepCount) * 100));
    this.eventStore.readyUnits.forEach((unit) => {
      unit.complete();
    });
    this.turnProgress("Ready", true);

    return this;
  }
}
