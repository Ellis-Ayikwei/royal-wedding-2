// Best-effort, per-instance limiting. A serverless deployment runs many instances that
// don't share this Map, so it caps a single instance's exposure rather than a hard
// global ceiling - enough to blunt casual abuse of the upload-token endpoint without a
// shared store to maintain for a single-event guest wall.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

const attempts = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    attempts.set(key, recent);
    return true;
  }
  recent.push(now);
  attempts.set(key, recent);
  return false;
}
