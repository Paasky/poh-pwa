import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { destroyDataBucket, useDataBucket } from "@/Data/useDataBucket";
import { initTestDataBucket } from "./_setup/dataHelpers";
import fs from "fs";
import path from "path";

describe("Static Data File Integrity", () => {
  beforeEach(async () => {
    await initTestDataBucket();
  });

  afterEach(() => {
    destroyDataBucket();
  });

  it("should verify all referenced media files exist and are not empty", () => {
    const bucket = useDataBucket();
    const allTypes = bucket.getTypes();
    const errors: string[] = [];
    const publicDir = path.resolve(process.cwd(), "public");

    const checkFile = (url: string, sourceKey: string, type: string) => {
      // URLs in staticData.json usually start with /
      let relativePath = url.startsWith("/") ? url.slice(1) : url;

      // Handle potential double slashes or other URL artifacts
      relativePath = relativePath.replace(/\/\//g, "/");

      const fullPath = path.join(publicDir, relativePath);

      if (!fs.existsSync(fullPath)) {
        // Only report if it's not a known missing file placeholder or empty string
        if (relativePath && relativePath !== "undefined") {
          errors.push(`[${type}] Missing file for ${sourceKey}: ${url} (Expected at ${fullPath})`);
        }
        return;
      }

      const stats = fs.statSync(fullPath);
      if (stats.size === 0) {
        errors.push(`[${type}] Empty file for ${sourceKey}: ${url}`);
      }
    };

    allTypes.forEach((typeObj) => {
      // Check image
      if (typeObj.image) {
        checkFile(typeObj.image, typeObj.key, "Image");
      }

      // Check audio (array)
      if (typeObj.audio && Array.isArray(typeObj.audio)) {
        typeObj.audio.forEach((audioUrl) => {
          checkFile(audioUrl, typeObj.key, "Audio");
        });
      }

      // Check quote URL
      if (typeObj.quote?.url) {
        checkFile(typeObj.quote.url, typeObj.key, "Quote Audio");
      }
    });

    if (errors.length > 0) {
      // Sort errors for better readability in the report
      errors.sort();
      console.error(`Found ${errors.length} static data file errors:\n${errors.join("\n")}`);
    }

    expect(
      errors,
      `Found ${errors.length} static data file errors. See console for details.`,
    ).toHaveLength(0);
  });
});
