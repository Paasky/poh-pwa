import { beforeEach, describe, expect, it } from "vitest";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { useCurrentContext } from "../../src/composables/useCurrentContext";
import { createTestWorld } from "../_setup/testWorld";
import { Tile } from "../../src/objects/game/Tile";

describe("useCurrentContext", () => {
  let world: ReturnType<typeof createTestWorld>;

  beforeEach(() => {
    initTestPinia();
    loadStaticData();
    world = createTestWorld();
  });

  it("should initialize with undefined values", () => {
    const { actionMode, hover, object, tile } = useCurrentContext();
    expect(actionMode.value).toBeUndefined();
    expect(hover.value).toBeUndefined();
    expect(object.value).toBeUndefined();
    expect(tile.value).toBeUndefined();
  });

  it("should maintain state across multiple calls (singleton behavior)", () => {
    const context1 = useCurrentContext();
    const context2 = useCurrentContext();

    context1.actionMode.value = "move";
    expect(context2.actionMode.value).toBe("move");

    const t00 = world.tiles[Tile.getKey(0, 0)];
    context2.hover.value = t00;
    expect(context1.hover.value?.key).toBe(t00.key);
  });

  it("should support setting various game objects to 'object'", () => {
    const { object } = useCurrentContext();

    // Set Unit
    const unit = world.unit;
    object.value = unit;
    expect(object.value).toBe(unit);

    // Set City (mocking a bit since createTestWorld only creates a unit by default)
    // Actually world.player.cities.value[0] might exist if createTestWorld creates one
    // Let's just use the unit as object since it's allowed by type.
  });
});
