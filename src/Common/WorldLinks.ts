import { useDataBucket } from "@/Data/useDataBucket";
import { TypeClass, TypeObject } from "@/Common/Objects/TypeObject";
import { TypeKey } from "@/Common/Objects/Common";
import { filter, map } from "@/Common/Helpers/collectionTools";

export interface WorldLinkFilters {
  typeClasses?: TypeClass[];
  continents?: TypeKey[];
  regions?: TypeKey[];
  cultures?: TypeKey[];
  leaders?: TypeKey[];
  eras?: number[]; // 1-5
  isMinor?: boolean;
}

export class WorldLinks {
  private static instance: WorldLinks;
  private initialized = false;

  // Internal maps for fast lookup
  private continentToRegions = new Map<TypeKey, Set<TypeKey>>();
  private regionToCultures = new Map<TypeKey, Set<TypeKey>>();

  // Mapping of TypeKey to its metadata (continent, region, era, etc.)
  private registry = new Map<
    TypeKey,
    {
      continent?: TypeKey;
      region?: TypeKey;
      era?: number;
      isMinor?: boolean;
      leader?: TypeKey;
      culture?: TypeKey;
    }
  >();

  private constructor() {}

  public static getInstance(): WorldLinks {
    if (!WorldLinks.instance) {
      WorldLinks.instance = new WorldLinks();
    }
    return WorldLinks.instance;
  }

  private init() {
    if (this.initialized) return;
    const bucket = useDataBucket();

    // 1. Map Continents to Regions
    bucket.getClassTypes("continentType").forEach((continent) => {
      const regions = continent.allows.filter((k) => k.startsWith("regionType:"));
      this.continentToRegions.set(continent.key, new Set(regions));
      regions.forEach((rKey) => {
        this.registry.set(rKey, { ...this.registry.get(rKey), continent: continent.key });
      });
    });

    // 2. Map Regions to Cultures
    bucket.getClassTypes("regionType").forEach((region) => {
      const cultures = region.allows.filter(
        (k) => k.startsWith("majorCultureType:") || k.startsWith("minorCultureType:"),
      );
      this.regionToCultures.set(region.key, new Set(cultures));
      cultures.forEach((cKey) => {
        const isMinor = cKey.startsWith("minorCultureType:");
        this.registry.set(cKey, {
          ...this.registry.get(cKey),
          region: region.key,
          continent: this.registry.get(region.key)?.continent,
          isMinor: isMinor,
        });
      });
    });

    // 3. Process Culture timelines for Eras and link Leaders
    const processedCultures = new Set<TypeKey>();
    this.regionToCultures.forEach((cultures) => {
      cultures.forEach((cKey) => {
        if (processedCultures.has(cKey)) return;

        const culture = bucket.getType(cKey);
        const timeline = this._typeTimeline(culture);

        timeline.forEach((t, index) => {
          const era = index + 1;
          const leaderKey = t.allows.find((k) => k.includes("LeaderType:")) as TypeKey;

          this.registry.set(t.key, { ...this.registry.get(t.key), era, leader: leaderKey });
          if (leaderKey) {
            this.registry.set(leaderKey, {
              ...this.registry.get(t.key),
              era,
              culture: t.key, // reverse link
            });
          }
          processedCultures.add(t.key);
        });
      });
    });

    this.initialized = true;
  }

  private _typeTimeline(type: TypeObject): TypeObject[] {
    const bucket = useDataBucket();
    let timeline = [type];
    let needle = undefined as TypeKey | undefined;
    let needleType = type as TypeObject | undefined;

    // Go backwards
    do {
      needle = needleType!.upgradesFrom.find((from) => from.startsWith(type.class + ":"));
      needleType = needle ? bucket.getType(needle) : undefined;
      if (needleType) {
        timeline = [needleType, ...timeline];
      }
    } while (needleType);

    // Go forwards
    needleType = type as TypeObject;
    do {
      needle = needleType!.upgradesTo.find((to) => to.startsWith(type.class + ":"));
      needleType = needle ? bucket.getType(needle) : undefined;
      if (needleType) {
        timeline.push(needleType as TypeObject);
      }
    } while (needleType);

    return timeline;
  }

  public getTimeline(cultureOrLeader: TypeObject): TypeObject[] {
    this.init();
    const bucket = useDataBucket();
    let culture = cultureOrLeader;

    if (cultureOrLeader.class.includes("LeaderType")) {
      const meta = this.registry.get(cultureOrLeader.key);
      if (meta?.culture) {
        culture = bucket.getType(meta.culture);
      }
    }

    const cultureTimeline = this._typeTimeline(culture);

    if (cultureOrLeader.class.includes("LeaderType")) {
      return map(cultureTimeline, (culture) => {
        return bucket.getType(this.registry.get(culture.key)!.leader!);
      });
    }

    return cultureTimeline;
  }

  /**
   * Flexible API to retrieve filtered TypeObjects
   */
  public only(filters: WorldLinkFilters): Set<TypeObject> {
    this.init();
    const bucket = useDataBucket();
    const allTypes = bucket.getTypes();

    const typeClasses = filters.typeClasses ? new Set(filters.typeClasses) : null;
    const continents = filters.continents ? new Set(filters.continents) : null;
    const regions = filters.regions ? new Set(filters.regions) : null;
    const cultures = filters.cultures ? new Set(filters.cultures) : null;
    const leaders = filters.leaders ? new Set(filters.leaders) : null;
    const eras = filters.eras ? new Set(filters.eras) : null;

    return filter(allTypes, (obj) => {
      const meta = this.registry.get(obj.key);

      if (typeClasses && !typeClasses.has(obj.class as TypeClass)) return false;
      if (continents && (!meta?.continent || !continents.has(meta.continent))) return false;
      if (regions && (!meta?.region || !regions.has(meta.region))) return false;

      // Handle cultures filter specifically: if obj is a culture, check its key. If it's a leader, check its culture link.
      if (cultures) {
        const cultureKey =
          obj.class === "majorCultureType" || obj.class === "minorCultureType"
            ? obj.key
            : meta?.culture;
        if (!cultureKey || !cultures.has(cultureKey)) return false;
      }

      if (leaders) {
        const leaderKey =
          obj.class === "majorLeaderType" || obj.class === "minorLeaderType"
            ? obj.key
            : meta?.leader;
        if (!leaderKey || !leaders.has(leaderKey)) return false;
      }

      if (eras && (!meta?.era || !eras.has(meta.era))) return false;
      return !(filters.isMinor !== undefined && meta?.isMinor !== filters.isMinor);
    });
  }
}

export const worldLinks = WorldLinks.getInstance();
