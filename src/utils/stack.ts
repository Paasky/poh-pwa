// Utility to enrich errors with a useful caller frame from our app code

function getOriginSafe(): string | null {
  try {
    // In browser/Vite

    if (typeof location !== "undefined" && location && location.origin) return location.origin;
  } catch {
    // ignore
  }
  return null;
}

function normalizeFrame(raw: string, origin: string | null): string {
  // Remove leading 'at ' and dev-server origin
  let out = raw.replace(/^at\s+/, "");
  if (origin) out = out.replaceAll(origin, "");
  // Strip webpack-internal prefixes if any
  out = out.replace(/^webpack-internal:\/\//, "");
  out = out.replace(/^\(webpack-internal:\/\//, "(");
  // Prefer '@/...' instead of '/src/...'
  out = out.replaceAll("/src/", "@/");
  // Drop Vite query suffixes like ?t=123 on file paths but keep :line:col
  out = out.replace(/(\.[tj]sx?|\.vue)(\?[^):]+)(:\d+:\d+)/, "$1$3");
  return out;
}

function getAppFrames(opts?: { exclude?: string[]; limit?: number; err?: Error }): string[] {
  const exclude = new Set(["/src/utils/stack.ts", "@/utils/stack.ts", ...(opts?.exclude ?? [])]);
  const err = opts?.err ?? new Error();
  const stack = err.stack ?? "";
  const origin = getOriginSafe();
  const lines = stack.split("\n").slice(1);
  const frames: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!trimmed.includes("/src/")) continue;
    if (trimmed.includes("node_modules")) continue;
    if (trimmed.includes("vite/client")) continue;
    // Normalize early so exclusion can match normalized strings too
    const normalized = normalizeFrame(trimmed, origin);
    let excluded = false;
    for (const ex of exclude) {
      if (!ex) continue;
      if (trimmed.includes(ex) || normalized.includes(ex)) {
        excluded = true;
        break;
      }
    }
    if (excluded) continue;
    frames.push(normalized);
    if (opts?.limit && frames.length >= opts.limit) break;
  }
  return frames;
}

export function withCallerContext(message: string, extraExclude?: string[]): Error {
  // Capture a single error and derive two frames from it:
  // 0 -> where withCallerContext was called (throw site)
  // 1 -> the immediate caller before the throw site
  const err = new Error();
  const frames = getAppFrames({ exclude: extraExclude, err });
  const thrownAt = frames[0] ?? "(throw site unknown)";
  // Exclude the throw site to get the previous src-function
  const calledFromRaw =
    getAppFrames({ exclude: [...(extraExclude ?? []), thrownAt], err })[0] ?? "(caller unknown)";
  return new Error(
    `${message} — thrown at ${thrownAt} — called from ${formatCalledFrom(calledFromRaw)}`,
  );
}

// Format a frame for the "called from" segment as:
//   "<func> in <filename>:<line>" or "<filename>:<line>" if func missing
function formatCalledFrom(frame: string): string {
  if (!frame || frame === "(caller unknown)") return frame;
  // Try to find filename and line first
  const fileMatch = frame.match(/([^/\s)]+?\.(?:ts|tsx|js|jsx|vue)):(\d+)/);
  if (!fileMatch) return frame;
  const file = fileMatch[1];
  const line = fileMatch[2];
  // Everything before the filename occurrence
  const idx = fileMatch.index ?? 0;
  const before = frame.slice(0, idx).trim().replace(/\($/, "").trim();
  let func: string | null = null;
  if (before) {
    const idMatch = before.match(/([A-Za-z0-9_$]+)\s*$/);
    if (idMatch) func = idMatch[1];
  }
  return func ? `${func} in ${file}:${line}` : `${file}:${line}`;
}
