import { useObjectsStore } from "@/stores/objectStore";
import { GameObject, generateKey } from "@/Common/Models/_GameModel";
import { City } from "@/Common/Models/City";
import { Tile } from "@/Common/Models/Tile";
import { Citizen } from "@/Common/Models/Citizen";
import type { Unit } from "@/Common/Models/Unit";
import { Construction } from "@/Common/Models/Construction";
import { Player } from "@/Common/Models/Player";

export function cityTestData(): void {
  const objStore = useObjectsStore();

  const objects = [] as GameObject[];
  const otherPlayer = objStore.getClassGameObjects("player")[1] as Player;

  for (const [index, cityName] of ["Helsinki", "Paris"].entries()) {
    // 1) create City object for `cityName` and push into `objects`
    //    - Match earlier test values: Helsinki -> canAttack=true, health=75, isCapital=true
    //      Paris -> canAttack=false, health=50, isCapital=false
    const x = 69 + index; // place cities on adjacent tiles
    const y = 69;
    const isHelsinki = cityName === "Helsinki";
    const city = new City(
      generateKey("city"),
      objStore.currentPlayer.key,
      Tile.getKey(x, y),
      cityName,
      isHelsinki, // canAttack
      isHelsinki ? 75 : 50, // health
      isHelsinki, // isCapital
      isHelsinki ? undefined : otherPlayer.key, // orig player key
    );
    objStore.set(city);
    objStore.currentPlayer.cityKeys.push(city.key);
    city.tile.cityKey = city.key;

    // 2) Citizens: create N citizens per city, set relations, and push into `objects`
    //    - Helsinki -> 3 citizens; Paris -> 2 citizens
    const citizenCount = isHelsinki ? 3 : 2;
    for (let i = 0; i < citizenCount; i++) {
      const cz = new Citizen(
        generateKey("citizen"),
        city.key,
        isHelsinki || i === 0 ? objStore.currentPlayer.cultureKey : otherPlayer.cultureKey,
        objStore.currentPlayer.key,
        city.tileKey,
      );
      // Track created object
      objStore.set(cz);
      // Set relation keys
      city.citizenKeys.push(cz.key);
      cz.culture.citizenKeys.push(cz.key);
      objStore.currentPlayer.citizenKeys.push(cz.key);
      city.tile.citizenKeys.push(cz.key);
    }

    // 3) Units: link some existing player units to this city (set cityKey etc.)
    //    - Per prior tests: Helsinki gets 2 units; Paris gets 0
    if (isHelsinki) {
      const units = objStore.currentPlayer.units as Unit[];
      const toAssign = Math.min(2, units.length);
      for (let i = 0; i < toAssign; i++) {
        const u = units[i]!;
        u.cityKey = city.key;
        city.unitKeys.push(u.key);
      }
    }

    // 4) Construction: create Palisades for Helsinki and add to queue with 10 progress
    if (isHelsinki) {
      const cons = new Construction(
        generateKey("construction"),
        objStore.getTypeObject("buildingType:palisades"),
        city.tileKey,
        city.key,
        100,
        10,
      );
      objStore.set(cons);
      city.tile.constructionKey = cons.key;
      city.constructionQueue.add(cons);
      city.constructionQueue.queue[0]!.progress = 10;
    }

    // 5) Training: add all current player's designs to Paris training queue with progress (5, 10, rest 0)
    if (!isHelsinki) {
      const designs = objStore.currentPlayer.designs;
      designs.forEach((d, idx) => {
        city.trainingQueue.add(d);
        if (idx === 0) city.trainingQueue.queue[0]!.progress = 5;
        else if (idx === 1) city.trainingQueue.queue[1]!.progress = 10;
      });
    }
  }

  objStore.bulkSet(objects);
}
