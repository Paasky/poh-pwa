import type { DataBucket } from "@/Data/DataBucket";
import { filter } from "@/Common/Helpers/collectionTools";
import { TypeClass, TypeKey } from "@/Common/Static/StaticEnums";
import { TypeObject } from "@/Common/Static/Objects/TypeObject";

export interface WorldLinkFilters {
  typeClasses?: TypeClass[];
  continents?: TypeKey[];
  regions?: TypeKey[];
  cultures?: TypeKey[];
  leaders?: TypeKey[];
  eras?: number[]; // 1-5 for cultures, or position in timeline for others
  isMinor?: boolean;
}

/**
 * WorldLinks manages spatial and temporal relationships between different TypeObjects.
 * It maintains a registry of metadata (continents, regions, eras, cultures, leaders)
 * and allows filtering objects based on these links.
 */
export class WorldLinks {
  private initialized = false;

  /** Maps a Continent key to a set of its Region keys */
  private continentToRegions = new Map<TypeKey, Set<TypeKey>>();

  /** Maps a Region key to a set of its Culture keys (both major and minor) */
  private regionToCultures = new Map<TypeKey, Set<TypeKey>>();

  /** Stores the upgrade/downgrade timeline for each type key */
  private timelines = new Map<TypeKey, TypeObject[]>();

  /**
   * A central registry of metadata for each type.
   * This allows O(1) lookups for spatial/temporal context when filtering.
   */
  private registry = new Map<
    TypeKey,
    {
      continent?: TypeKey;
      region?: TypeKey;
      era?: number; // 1-based index representing the position in the timeline
      isMinor?: boolean;
      leader?: TypeKey;
      cultures?: TypeKey[]; // Leaders can be shared between multiple cultures
    }
  >();

  constructor(private bucket: DataBucket) {}

  /**
   * Initializes the links between continents, regions, cultures, and leaders.
   * This is called automatically by public methods if not already initialized.
   */
  public init() {
    if (this.initialized) return;

    // 1. Map Continents to Regions
    // Continents "allow" regions. We populate the registry with the continent key for each region.
    this.bucket.getClassTypes("continentType").forEach((continent) => {
      const regions = continent.allows.filter((k) => k.startsWith("regionType:"));
      this.continentToRegions.set(continent.key, new Set(regions));
      regions.forEach((rKey) => {
        this.registry.set(rKey, { ...this.registry.get(rKey), continent: continent.key });
      });
    });

    // 2. Map Regions to Cultures
    // Regions "allow" cultures. We propagate the continent/region info down to the culture level.
    this.bucket.getClassTypes("regionType").forEach((region) => {
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
          isMinor,
        });
      });
    });

    // 3. Process ALL types to populate registry and timelines
    const processed = new Set<TypeKey>();
    const types = Array.from(this.bucket.getTypes());

    // 3a. Register leaders in registry first
    // This extracts explicit culture requirements from leaders themselves.
    types.forEach((type) => {
      const meta = { ...(this.registry.get(type.key) || {}) };
      if (type.class.includes("LeaderType")) {
        // Leaders often "require" specific cultures
        const leaderCultures = type.requires.filter(["majorCultureType", "minorCultureType"]);
        const currentCultures = meta.cultures || [];
        leaderCultures.allTypes.forEach((cKey) => {
          if (!currentCultures.includes(cKey as TypeKey)) {
            currentCultures.push(cKey as TypeKey);
          }
        });
        meta.cultures = currentCultures;
        meta.leader = type.key;
      }
      this.registry.set(type.key, meta);
    });

    // 3b. Process timelines and link cultures/leaders
    // This handles the "allows" side (cultures allowing leaders) and calculates eras.
    types.forEach((type) => {
      if (processed.has(type.key)) return;

      const timeline = this._typeTimeline(type);
      const isCulture = type.class.includes("CultureType");

      timeline.forEach((t, index) => {
        const era = index + 1;
        const meta = { ...this.registry.get(t.key), era };

        if (isCulture) {
          // If this culture allows a leader, link them together.
          const leaderKey = t.allows.find((k) => k.includes("LeaderType:")) as TypeKey;
          if (leaderKey) {
            const leaderMeta = this.registry.get(leaderKey) || {};
            const currentCultures = leaderMeta.cultures || [];
            if (!currentCultures.includes(t.key)) {
              currentCultures.push(t.key);
            }

            this.registry.set(leaderKey, {
              ...leaderMeta,
              ...meta, // Inherit culture's spatial/temporal info (continent, region, era)
              cultures: currentCultures,
              leader: leaderKey,
            });
            meta.leader = leaderKey;
          }
        }

        this.registry.set(t.key, meta);
        this.timelines.set(t.key, timeline);
        processed.add(t.key);
      });
    });

    this.initialized = true;
  }

  /**
   * Builds an ordered timeline of upgrades/downgrades for a given type.
   * For cultures, this represents their progression through eras.
   */
  private _typeTimeline(type: TypeObject): TypeObject[] {
    const timeline = [type];
    let needleType: TypeObject | undefined = type;

    // Traverse Backwards (upgradesFrom)
    while (needleType?.upgradesFrom.length) {
      const prevKey = needleType.upgradesFrom.find((k) => k.startsWith(type.class + ":")) as
        | TypeKey
        | undefined;
      needleType = prevKey ? this.bucket.getType(prevKey as TypeKey) : undefined;
      if (needleType) timeline.unshift(needleType);
    }

    // Traverse Forwards (upgradesTo)
    needleType = type;
    while (needleType?.upgradesTo.length) {
      const nextKey = needleType.upgradesTo.find((k) => k.startsWith(type.class + ":")) as
        | TypeKey
        | undefined;
      needleType = nextKey ? this.bucket.getType(nextKey as TypeKey) : undefined;
      if (needleType) timeline.push(needleType);
    }

    return timeline;
  }

  /**
   * Returns the full timeline (all upgrade levels) for a given type.
   */
  public getTimeline(type: TypeObject): TypeObject[] {
    this.init();
    return this.timelines.get(type.key) || [type];
  }

  /**
   * Filters all types in the bucket based on the provided criteria.
   * Matches objects that satisfy ALL active filter categories.
   */
  public only(filters: WorldLinkFilters): Set<TypeObject> {
    this.init();
    const allTypes = this.bucket.getTypes();

    // Convert filter arrays to Sets for O(1) lookup during iteration
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

      // Culture filter logic:
      // 1. If the object IS a culture, check its key against the filter.
      // 2. Otherwise (e.g. leader or building), check its associated cultures in the registry.
      if (cultures) {
        const objectCultures =
          obj.class === "majorCultureType" || obj.class === "minorCultureType"
            ? [obj.key]
            : meta?.cultures || [];
        if (!objectCultures.some((c) => cultures.has(c))) return false;
      }

      // Leader filter logic:
      // 1. If the object IS a leader, check its key against the filter.
      // 2. Otherwise (e.g. culture), check its associated leader in the registry.
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
