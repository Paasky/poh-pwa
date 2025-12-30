import { describe, expect, it } from "vitest";
import {
  aWord,
  capitalize,
  includes,
  theWord,
  typeObjWithArticle,
} from "../../src/helpers/textTools";
import { initTestPinia, loadStaticData } from "../_setup/pinia";
import { useDataBucket } from "../../src/Data/useDataBucket";

describe("textTools", () => {
  it("includes", () => {
    expect(includes("Hello World", "hello")).toBe(true);
    expect(includes("Héllò Wôrld", "hÉllö")).toBe(true);
    expect(includes("Hello World", "abc")).toBe(false);
    expect(includes("Hello World", "")).toBe(false);
  });

  it("theWord", () => {
    expect(theWord("apple")).toBe("the apple");
    expect(theWord("apple", 2)).toBe("the 2 apples");
  });

  it("aWord", () => {
    expect(aWord("apple")).toBe("an apple");
    expect(aWord("banana")).toBe("a banana");
    expect(aWord("apple", 2)).toBe("2 apples");
  });

  it("capitalize", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("typeObjWithArticle", () => {
    initTestPinia();
    loadStaticData();
    const objectsStore = useDataBucket();

    const grass = objectsStore.getTypeObject("terrainType:grass");
    expect(typeObjWithArticle(grass)).toBe("a Grass");

    // Check wonder (should use "the")
    const tajMahal = objectsStore.getTypeObject("worldWonderType:tajMahal");
    expect(typeObjWithArticle(tajMahal)).toBe("the Taj Mahal");
  });
});
