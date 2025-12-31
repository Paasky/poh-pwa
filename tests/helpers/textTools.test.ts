import { describe, expect, it } from "vitest";
import { aWord, capitalize, includes, theWord, typeObjWithArticle } from "@/helpers/textTools";
import { useDataBucket } from "@/Data/useDataBucket";
import { initTestDataBucket } from "../_setup/dataHelpers";

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
    initTestDataBucket();
    const bucket = useDataBucket();

    const grass = bucket.getType("terrainType:grass");
    expect(typeObjWithArticle(grass)).toBe("a Grass");

    // Check wonder (should use "the")
    const tajMahal = bucket.getType("worldWonderType:tajMahal");
    expect(typeObjWithArticle(tajMahal)).toBe("the Taj Mahal");
  });
});
