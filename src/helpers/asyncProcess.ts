export async function asyncProcess<T>(
  objs: readonly T[],
  process: (obj: T, index: number) => void,
  onProgress?: (percent: number | true) => void,
  batchSize: number = 1,
  yieldEveryMs: number = 1,
): Promise<void> {
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
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      lastYield = performance.now();
    }
  }

  onProgress?.(true);
}
