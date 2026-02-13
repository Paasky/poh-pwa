/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StaticDataCompiler } from "@/Data/StaticDataCompiler";
import fs from "fs";
import path from "path";
import os from "os";

describe("StaticDataCompiler", () => {
  let testRootDir: string;
  let sourceDir: string;
  let outputDir: string;

  beforeEach(() => {
    testRootDir = fs.mkdtempSync(path.join(os.tmpdir(), "poh-test-"));
    sourceDir = path.join(testRootDir, "data");
    outputDir = path.join(testRootDir, "public", "data");
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testRootDir)) {
      fs.rmSync(testRootDir, { recursive: true, force: true });
    }
  });

  describe("Happy path", () => {
    it("should correctly process a complete dataset including categories, types, subfolders, and back-relations", () => {
      const categoriesDir = path.join(sourceDir, "categories");
      const typesDir = path.join(sourceDir, "types");
      const conceptsDir = path.join(sourceDir, "concepts"); // To avoid reference errors
      const typesSubfolder = path.join(typesDir, "subfolder");

      fs.mkdirSync(categoriesDir, { recursive: true });
      fs.mkdirSync(typesDir, { recursive: true });
      fs.mkdirSync(conceptsDir, { recursive: true });
      fs.mkdirSync(typesSubfolder, { recursive: true });

      // The compiler ingests data from 'categories' and 'types' folders.
      // Any referenced concepts must be placed in one of these folders.
      fs.writeFileSync(
        path.join(categoriesDir, "cat1.json"),
        JSON.stringify([
          { key: "regionCategory:cat1", name: "Cat 1", concept: "conceptType:region" },
        ]),
      );

      fs.writeFileSync(
        path.join(typesDir, "type1.json"),
        JSON.stringify([
          {
            key: "regionType:t1",
            name: "Type 1",
            concept: "conceptType:region",
            category: "regionCategory:cat1",
            requires: ["regionType:t2"],
          },
          {
            key: "conceptType:region",
            name: "Concept 1",
            concept: "conceptType:region",
          },
        ]),
      );

      fs.writeFileSync(
        path.join(typesSubfolder, "type2.json"),
        JSON.stringify([
          {
            key: "regionType:t2",
            name: "Type 2",
            concept: "conceptType:region",
            upgradesFrom: ["regionType:t1"],
            gains: ["regionType:t1"],
          },
        ]),
      );

      const compiler = new StaticDataCompiler(sourceDir, outputDir);
      compiler.compile();

      const outputFilePath = path.join(outputDir, "staticData.json");
      expect(fs.existsSync(outputFilePath)).toBe(true);

      const writtenData = JSON.parse(fs.readFileSync(outputFilePath, "utf8"));

      // Verify Categories & Types
      expect(writtenData.categories).toHaveLength(1);
      expect(writtenData.types).toHaveLength(3); // t1, t2, concept1

      const cat1 = writtenData.categories.find((c: any) => c.key === "regionCategory:cat1");
      const t1 = writtenData.types.find((t: any) => t.key === "regionType:t1");
      const t2 = writtenData.types.find((t: any) => t.key === "regionType:t2");

      // Verify Back-relations
      expect(t2.allows).toContain("regionType:t1");
      expect(t1.upgradesTo).toContain("regionType:t2");
      expect(cat1.relatesTo).toContain("regionType:t1");
      expect(t1.relatesTo).toContain("regionType:t2");
    });
  });

  describe("Error handling", () => {
    it("should handle file system and JSON format errors", () => {
      const typesDir = path.join(sourceDir, "types");
      const categoriesDir = path.join(sourceDir, "categories");
      fs.mkdirSync(typesDir, { recursive: true });
      fs.mkdirSync(categoriesDir, { recursive: true });

      fs.writeFileSync(path.join(typesDir, "bad.json"), "invalid json");

      const compiler = new StaticDataCompiler(sourceDir, outputDir);
      expect(() => compiler.compile()).toThrow("Static Data Compiler failed with 1 errors.");
    });

    it("should validate data integrity: schemas, duplication, and missing keys", () => {
      const typesDir = path.join(sourceDir, "types");
      const categoriesDir = path.join(sourceDir, "categories");
      fs.mkdirSync(typesDir, { recursive: true });
      fs.mkdirSync(categoriesDir, { recursive: true });

      fs.writeFileSync(
        path.join(typesDir, "errors.json"),
        JSON.stringify([
          {
            key: "invalidPrefix:t1", // Zod schema violation (prefix)
            name: "Invalid Prefix",
            concept: "conceptType:c1",
          },
          {
            key: "testType:duplicate",
            name: "Dup 1",
            concept: "conceptType:c1",
          },
          {
            key: "testType:duplicate", // Duplicate key
            name: "Dup 2",
            concept: "conceptType:c1",
          },
          {
            key: "testType:missingRel",
            name: "Missing Rel",
            concept: "conceptType:nonExistent", // Missing relation
          },
        ]),
      );

      const compiler = new StaticDataCompiler(sourceDir, outputDir);
      // Expecting exactly 4 errors: 1 validation, 1 duplicate, 2 reference errors
      expect(() => compiler.compile()).toThrow(/failed with 4 errors/);
    });
  });

  describe("Full data compile", () => {
    it("should compile real data from the data folder correctly", () => {
      const outputDirReal = path.join(process.cwd(), "public", "data");
      const outputFile = path.join(outputDirReal, "staticData.json");
      const analysisFile = path.join(outputDirReal, "staticAnalysis.json");

      // Run the compiler on the actual project data to verify overall consistency.

      const compiler = new StaticDataCompiler();
      compiler.compile();

      expect(fs.existsSync(outputFile)).toBe(true);
      expect(fs.existsSync(analysisFile)).toBe(true);

      const data = JSON.parse(fs.readFileSync(outputFile, "utf8"));

      // Spot-checks
      expect(data.categories.length).toBeGreaterThan(0);
      expect(data.types.length).toBeGreaterThan(0);

      const regionAmerica = data.categories.find((c: any) => c.key === "regionCategory:america");
      if (regionAmerica) {
        expect(regionAmerica.name).toBeDefined();
      }

      const greatLakes = data.types.find((t: any) => t.key === "regionType:greatLakes");
      if (greatLakes) {
        expect(greatLakes.name).toBeDefined();
      }
    });
  });
});
