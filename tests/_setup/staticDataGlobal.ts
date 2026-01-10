import { vi } from "vitest";
import fs from "fs";
import path from "path";
import { getStaticData, type ParsedStaticData } from "../../src/Data/StaticDataLoader";

let cachedDataPromise: Promise<ParsedStaticData> | null = null;

// Mock fetch to read from local file system
// This allows StaticDataLoader to work in Vitest without a real server
vi.stubGlobal("fetch", async (input: string | URL | Request) => {
  const url = input instanceof Request ? input.url : input.toString();

  // Map /data/*.json to public/data/*.json
  const relativePath = url.startsWith("/") ? url.slice(1) : url;
  const dataPath = path.resolve(process.cwd(), "public", relativePath);

  if (!fs.existsSync(dataPath)) {
    return new Response(null, { status: 404, statusText: "Not Found" });
  }

  const content = fs.readFileSync(dataPath, "utf-8");
  return new Response(content, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Returns the pre-loaded static data.
 * Used by initTestDataBucket to provide data synchronously to tests.
 */
export async function getCachedStaticData(): Promise<ParsedStaticData> {
  if (!cachedDataPromise) {
    cachedDataPromise = getStaticData();
  }
  return cachedDataPromise;
}
