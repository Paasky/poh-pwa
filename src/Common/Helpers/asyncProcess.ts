export async function asyncProcess(
  tasks: readonly Task[],
  process: (task: Task, index: number) => void | Promise<void>,
  onProgress?: ProgressCallback,
): Promise<void> {
  const total = tasks.length;
  for (const [i, task] of tasks.entries()) {
    await process(task, i);

    onProgress?.(task, Math.floor(((i + 1) / total) * 100));

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

  onProgress?.({ title: "Ready", fn: () => {} }, true);
}

export interface Task {
  title: string;
  fn: () => void | Promise<void>;
}

export interface ProgressCallback {
  (task: Task, percent: number | true): void;
}
