/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaticDataCompiler } from "@/Data/StaticDataCompiler";
import fs from 'fs';
import path from 'path';

vi.mock('fs');

describe('StaticDataCompiler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy path', () => {
    it('should correctly process a complete dataset including categories, types, subfolders, and back-relations', () => {
      const mockCwd = '/root';
      vi.spyOn(process, 'cwd').mockReturnValue(mockCwd);

      const mockData = {
        [path.join(mockCwd, 'data', 'categories')]: { isDirectory: true },
        [path.join(mockCwd, 'data', 'types')]: { isDirectory: true },
        [path.join(mockCwd, 'data', 'categories', 'cat1.json')]: JSON.stringify([
          { key: 'testCategory:cat1', name: 'Cat 1', concept: 'conceptType:c1' }
        ]),
        [path.join(mockCwd, 'data', 'types', 'type1.json')]: JSON.stringify([
          { 
            key: 'testType:t1', 
            name: 'Type 1', 
            concept: 'conceptType:c1', 
            category: 'testCategory:cat1',
            requires: ['testType:t2']
          }
        ]),
        [path.join(mockCwd, 'data', 'types', 'subfolder')]: { isDirectory: true },
        [path.join(mockCwd, 'data', 'types', 'subfolder', 'type2.json')]: JSON.stringify([
          { 
            key: 'testType:t2', 
            name: 'Type 2', 
            concept: 'conceptType:c1',
            upgradesFrom: ['testType:t1'],
            gains: ['testType:t1']
          }
        ]),
      };

      // @bible-check 1.5: Using 'any' because vitest's vi.mock('fs') doesn't automatically 
      // provide correct TypeScript types for the mocked functions in all IDE configurations.
      (fs.existsSync as any).mockImplementation((p: string) => !!mockData[p as keyof typeof mockData]);
      (fs.statSync as any).mockImplementation((p: string) => ({
        isDirectory: () => (mockData[p as keyof typeof mockData] as any)?.isDirectory
      }));
      (fs.readdirSync as any).mockImplementation((p: string) => {
        const dirPath = p.endsWith('/') ? p : p + '/';
        return Object.keys(mockData)
          .filter(k => k.startsWith(dirPath) && k.split(dirPath)[1].split('/').length === 1)
          .map(k => k.split(dirPath)[1]);
      });
      (fs.readFileSync as any).mockImplementation((p: string) => mockData[p as keyof typeof mockData]);

      const compiler = new StaticDataCompiler();
      compiler.compile();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(mockCwd, 'public', 'data', 'staticData.json'),
        expect.any(String)
      );

      // @bible-check 1.5: Accessing vitest mock calls via 'any' to avoid complex type casting for the mock implementation.
      const writtenData = JSON.parse((fs.writeFileSync as any).mock.calls.find((call: any[]) => call[0].endsWith('staticData.json'))[1]);
      
      // Verify Categories & Types
      expect(writtenData.categories).toHaveLength(1);
      expect(writtenData.types).toHaveLength(2);

      const cat1 = writtenData.categories.find((c: any) => c.key === 'testCategory:cat1');
      const t1 = writtenData.types.find((t: any) => t.key === 'testType:t1');
      const t2 = writtenData.types.find((t: any) => t.key === 'testType:t2');

      // Verify Back-relations
      // t1 requires t2 -> t2 should have t1 in allows
      expect(t2.allows).toContain('testType:t1');
      
      // t2 upgradesFrom t1 -> t1 should have t2 in upgradesTo
      expect(t1.upgradesTo).toContain('testType:t2');
      
      // t1 belongs to cat1 -> cat1 should have t1 in relatesTo
      expect(cat1.relatesTo).toContain('testType:t1');

      // t2 has gains t1 -> t1 should have t2 in relatesTo
      expect(t1.relatesTo).toContain('testType:t2');
    });
  });

  describe('Error handling', () => {
    it('should handle file system and JSON format errors', () => {
      const mockCwd = '/root';
      vi.spyOn(process, 'cwd').mockReturnValue(mockCwd);

      const mockData = {
        [path.join(mockCwd, 'data', 'categories')]: { isDirectory: true },
        [path.join(mockCwd, 'data', 'types')]: { isDirectory: true },
        [path.join(mockCwd, 'data', 'types', 'bad.json')]: 'invalid json',
      };

      // @bible-check 1.5: Using 'any' because vitest's vi.mock('fs') doesn't automatically 
      // provide correct TypeScript types for the mocked functions in all IDE configurations.
      (fs.existsSync as any).mockImplementation((p: string) => !!mockData[p as keyof typeof mockData]);
      (fs.statSync as any).mockImplementation((p: string) => ({
        isDirectory: () => (mockData[p as keyof typeof mockData] as any)?.isDirectory
      }));
      (fs.readdirSync as any).mockImplementation((p: string) => {
        const dirPath = p.endsWith('/') ? p : p + '/';
        return Object.keys(mockData)
          .filter(k => k.startsWith(dirPath))
          .map(k => k.split(dirPath)[1]);
      });
      (fs.readFileSync as any).mockImplementation((p: string) => mockData[p as keyof typeof mockData]);

      const compiler = new StaticDataCompiler();
      expect(() => compiler.compile()).toThrow(/JSON Error.*bad\.json/);
    });

    it('should validate data integrity: schemas, duplication, and missing keys', () => {
      const mockCwd = '/root';
      vi.spyOn(process, 'cwd').mockReturnValue(mockCwd);

      const mockData = {
        [path.join(mockCwd, 'data', 'categories')]: { isDirectory: true },
        [path.join(mockCwd, 'data', 'types')]: { isDirectory: true },
        [path.join(mockCwd, 'data', 'types', 'errors.json')]: JSON.stringify([
          { 
            key: 'invalidPrefix:t1', // Zod schema violation (prefix)
            name: 'Invalid Prefix',
            concept: 'conceptType:c1'
          },
          {
            key: 'testType:duplicate',
            name: 'Dup 1',
            concept: 'conceptType:c1'
          },
          {
            key: 'testType:duplicate', // Duplicate key
            name: 'Dup 2',
            concept: 'conceptType:c1'
          },
          {
            key: 'testType:missingRel',
            name: 'Missing Rel',
            concept: 'conceptType:nonExistent' // Missing relation
          }
        ]),
      };

      // @bible-check 1.5: Using 'any' because vitest's vi.mock('fs') doesn't automatically 
      // provide correct TypeScript types for the mocked functions in all IDE configurations.
      (fs.existsSync as any).mockImplementation((p: string) => !!mockData[p as keyof typeof mockData]);
      (fs.statSync as any).mockImplementation((p: string) => ({
        isDirectory: () => (mockData[p as keyof typeof mockData] as any)?.isDirectory
      }));
      (fs.readdirSync as any).mockImplementation((p: string) => {
        const dirPath = p.endsWith('/') ? p : p + '/';
        return Object.keys(mockData)
          .filter(k => k.startsWith(dirPath))
          .map(k => k.split(dirPath)[1]);
      });
      (fs.readFileSync as any).mockImplementation((p: string) => mockData[p as keyof typeof mockData]);

      const compiler = new StaticDataCompiler();
      // Expecting exactly 4 errors: 1 validation, 1 duplicate, 2 reference errors (missing concepts for the 2 valid objects + the missingRel object)
      // Actually, invalidPrefix:t1 will fail validation.
      // testType:duplicate (first) will pass validation.
      // testType:duplicate (second) will fail as duplicate.
      // testType:missingRel will pass validation but fail reference check.
      // Wait, let's look at StaticDataCompiler.ts:
      // ingestFiles:
      // 1. invalidPrefix:t1 -> validation error.
      // 2. testType:duplicate (1st) -> added to registry.
      // 3. testType:duplicate (2nd) -> duplicate error.
      // 4. testType:missingRel -> added to registry.
      // process:
      // 5. testType:duplicate (1st) refers to conceptType:c1 -> reference error (missing).
      // 6. testType:missingRel refers to conceptType:nonExistent -> reference error (missing).
      
      expect(() => compiler.compile()).toThrow(/failed with 4 errors/);
    });
  });

  describe('Full data compile', () => {
    it('should compile real data from the data folder correctly', async () => {
      vi.unmock('fs');
      const fsReal = await import('fs');
      const pathReal = await import('path');
      
      const outputDir = pathReal.join(process.cwd(), 'public', 'data');
      const outputFile = pathReal.join(outputDir, 'staticData.json');
      const analysisFile = pathReal.join(outputDir, 'staticAnalysis.json');

      // Cleanup
      if (fsReal.existsSync(outputFile)) fsReal.unlinkSync(outputFile);
      if (fsReal.existsSync(analysisFile)) fsReal.unlinkSync(analysisFile);

      const compiler = new StaticDataCompiler();
      compiler.compile();

      expect(fsReal.existsSync(outputFile)).toBe(true);
      expect(fsReal.existsSync(analysisFile)).toBe(true);

      const data = JSON.parse(fsReal.readFileSync(outputFile, 'utf8'));
      
      // Spot-checks
      expect(data.categories.length).toBeGreaterThan(0);
      expect(data.types.length).toBeGreaterThan(0);

      const regionAmerica = data.categories.find((c: any) => c.key === 'regionCategory:america');
      if (regionAmerica) {
        expect(regionAmerica.name).toBeDefined();
      }

      const greatLakes = data.types.find((t: any) => t.key === 'regionType:greatLakes');
      if (greatLakes) {
        expect(greatLakes.name).toBeDefined();
      }
    });
  });
});