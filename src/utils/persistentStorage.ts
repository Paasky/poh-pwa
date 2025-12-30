// noinspection ExceptionCaughtLocallyJS

export type PersistEnvelope<T> = {
  version: string;
  time: number;
  data: T;
};

export function saveToBrowser<T>(key: string, version: string, data: T): void {
  const env: PersistEnvelope<T> = { version, time: Date.now(), data };
  // will throw on failure
  localStorage.setItem(key, JSON.stringify(env));
}

export function loadFromBrowser<T>(key: string, expectedVersion?: string): T | undefined {
  const env = loadEnvelope<T>(key);
  if (!env) return undefined;

  // If expectedVersion is provided, we still return undefined on mismatch for backward compatibility
  // or simple use cases. Advanced use cases should use loadEnvelope.
  if (expectedVersion !== undefined && env.version !== expectedVersion) return undefined;

  return env.data;
}

export function loadEnvelope<T>(key: string): PersistEnvelope<T> | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const env = JSON.parse(raw) as PersistEnvelope<T> | unknown;

    // Verify env as it's potentially corrupted
    // Throw with a concise reason; callers still get `undefined` because we catch below,
    // but the console will contain a clear diagnostic message for debugging.
    if (!env || typeof env !== "object") {
      throw new Error(`Persistent data for '${key}' is not an object`);
    }
    const anyEnv = env as Record<string, unknown>;

    if (typeof anyEnv.version !== "string") {
      throw new Error(`Persistent data for '${key}' is missing a string 'version'`);
    }
    if (typeof anyEnv.time !== "number") {
      throw new Error(`Persistent data for '${key}' is missing a numeric 'time'`);
    }
    if (!("data" in anyEnv)) {
      throw new Error(`Persistent data for '${key}' is missing the 'data' field`);
    }

    return anyEnv as unknown as PersistEnvelope<T>;
  } catch (err) {
    // Swallow errors but log a concise message so the app continues with defaults
    // eslint-disable-next-line
    console.warn(`[persistentStorage] Failed to load key '${key}':`, err);
    return undefined;
  }
}
