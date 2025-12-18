// noinspection ExceptionCaughtLocallyJS

export type PersistEnvelope<T> = {
  v: number; // schema version
  at: number; // saved at (ms since epoch)
  data: T;
};

export function saveToBrowser<T>(key: string, version: number, data: T): void {
  const env: PersistEnvelope<T> = { v: version, at: Date.now(), data };
  // will throw on failure
  localStorage.setItem(key, JSON.stringify(env));
}

export function loadFromBrowser<T>(key: string, expectedVersion: number): T | undefined {
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
    if (typeof anyEnv.v !== "number") {
      throw new Error(`Persistent data for '${key}' is missing a numeric 'v' (version)`);
    }
    if (typeof anyEnv.at !== "number") {
      throw new Error(`Persistent data for '${key}' is missing a numeric 'at' (timestamp)`);
    }
    if (!("data" in anyEnv)) {
      throw new Error(`Persistent data for '${key}' is missing the 'data' field`);
    }
    // Version mismatch is not an error: caller may add migrations later
    if (anyEnv.v !== expectedVersion) return undefined;

    return anyEnv.data as T;
  } catch (err) {
    // Swallow errors but log a concise message so the app continues with defaults
    // eslint-disable-next-line
    console.warn(`[persistentStorage] Failed to load key '${key}':`, err);
    return undefined;
  }
}
