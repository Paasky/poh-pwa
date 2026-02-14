import { useDataBucket } from "@/Data/useDataBucket";
import { createPlayer, PlayerCluster } from "@/Common/factories/models/player";

/**
 * Seeds N major culture players into the active DataBucket and sets world.currentPlayerKey.
 *
 * - count=2 (default): human + 1 AI. Enough for basic interaction tests.
 * - count=5: human + 4 AI (2 ally pairs + 1 neutral). For complex diplomacy/AI tests.
 *
 * Uses WorldLinks to resolve era-1 (start) culture types — no RNG, fully deterministic.
 * Requires initTestDataBucket() + createTestWorld() to have been called first.
 *
 * Returns the created PlayerClusters so tests can reference specific players/keys.
 */
export function populateTestPlayers(count: 2 | 5 = 2): PlayerCluster[] {
  const bucket = useDataBucket();

  const startCultureTypes = Array.from(
    bucket.links.only({ typeClasses: ["majorCultureType"], eras: [1] }),
  );

  if (startCultureTypes.length < count) {
    throw new Error(
      `populateTestPlayers: need ${count} start culture types, only found ${startCultureTypes.length}`,
    );
  }

  const clusters: PlayerCluster[] = [];

  for (let i = 0; i < count; i++) {
    const cluster = createPlayer({
      cultureType: startCultureTypes[i],
      userName: `Player ${i + 1}`,
      isHuman: i === 0,
    });

    bucket.setRawObjects(cluster.all.map((o) => o.toJSON()) as any);
    clusters.push(cluster);
  }

  bucket.setWorld({ currentPlayerKey: clusters[0].player.key });

  return clusters;
}
