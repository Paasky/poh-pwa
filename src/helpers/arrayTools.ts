/* eslint-disable @typescript-eslint/no-explicit-any */
export function getRandom<T>(arr: readonly T[]): T {
  if (arr.length < 1) throw new Error(`Not enough items in array: ${arr.length}`);
  const copy = [...arr];
  return takeRandom(copy);
}

export function getManyRandom<T>(arr: readonly T[], count: number): T[] {
  if (arr.length < count) throw new Error(`Not enough items in array: ${arr.length} < ${count}`);
  const copy = [...arr];
  return takeManyRandom(copy, count);
}

export function takeRandom<T>(arr: T[]): T {
  if (arr.length < 1) throw new Error(`Not enough items in array: ${arr.length}`);
  return takeManyRandom(arr, 1)[0];
}

export function takeManyRandom<T>(arr: T[], count: number): T[] {
  if (arr.length < count) throw new Error(`Not enough items in array: ${arr.length} < ${count}`);
  const out: T[] = [];
  while (out.length < count) {
    const i = Math.floor(Math.random() * arr.length);
    out.push(arr.splice(i, 1)[0] as T);
  }
  return out;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function range(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

// Not necessarily an array tool, but useful here
export const SKIP_DESCEND = Symbol("CRAWL_SKIP_DESCEND");
export const REMOVE_NODE = Symbol("CRAWL_REMOVE_NODE");

export function crawl<TInput>(
  // The input value to crawl.
  // Note this function also works on primitives (undefined/null/string/number, etc.)
  v: TInput,

  // The function to call on each value.
  // Return SKIP_DESCEND to skip descent into v's children.
  // Return REMOVE_NODE to remove v from the output.
  process: <TValue>(
    v: TValue,
    k: number | string | undefined,
    path: string | undefined,
  ) => TValue | typeof SKIP_DESCEND | typeof REMOVE_NODE | any,

  // Should this value be processed/kept?
  // Return SKIP_DESCEND to skip descent into v's children.
  // Return REMOVE_NODE to remove v from the output.
  // Return true to keep v in the output.
  whatToDo?: <TValue>(
    v: TValue,
    k: number | string | undefined,
    path: string | undefined,
  ) => typeof SKIP_DESCEND | typeof REMOVE_NODE | true,

  // Don't pass in, uUsed when crawling to return key to you in process()
  k?: number | string | undefined,

  // Don't pass in, used when crawling to return crawled path to you in process()
  path?: string | undefined,
): TInput | any {
  // Ask if it should be skipped/removed
  const vAnswer = whatToDo ? whatToDo(v, k, path) : true;
  if (vAnswer === SKIP_DESCEND) return v;
  if (vAnswer === REMOVE_NODE) return REMOVE_NODE;

  // Return early for primitives
  if (v === undefined || v === null || typeof v !== "object") {
    return process(v, k, path);
  }

  // Start processing Arrays & Objects

  // Map arrays recursively
  if (Array.isArray(v)) {
    const out = [] as any[];
    for (const [arrK, arrV] of v.entries()) {
      const crawled = crawl(arrV, process, whatToDo, arrK, path ? `${path}[${arrK}]` : `[${arrK}]`);

      if (crawled === REMOVE_NODE) continue;
      out.push(crawled);
    }
    return out as TInput;
  }

  // Map objects recursively
  const out = {} as any;
  for (const [objK, objV] of Object.entries(v)) {
    const crawled = crawl(objV, process, whatToDo, objK, path ? `${path}.${objK}` : objK);

    if (crawled === REMOVE_NODE) continue;
    out[objK] = crawled;
  }
  return out as TInput;
}
