export async function asyncProcess<T>({
  objs,
  process,
  onProgress,
  batchSize = 200,
  yieldEveryMs = 100,
}: {
  objs: readonly T[];
  process: (obj: T, index: number) => void;
  onProgress?: (percent: number | true) => void;
  batchSize?: number; // default 200
  yieldEveryMs?: number; // default 100
}): Promise<void> {
  const total = objs.length;
  let i = 0;
  let lastYield = performance.now();

  while (i < total) {
    const end = Math.min(i + batchSize, total);

    for (; i < end; i++) {
      process(objs[i], i);
    }

    onProgress?.(Math.floor((i / total) * 100));

    if (performance.now() - lastYield >= yieldEveryMs) {
      await Promise.resolve(); // yield to UI
      lastYield = performance.now();
    }
  }

  onProgress?.(true);
}
