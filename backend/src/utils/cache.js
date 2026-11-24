/**
 * Small in-memory TTL cache with a size cap and in-flight de-duplication:
 * if ten requests ask for the same missing key at once, the loader runs once.
 */
export class TTLCache {
  constructor({ ttlMs = 60000, maxEntries = 500 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.store = new Map();
    this.inflight = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expires <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    this.store.delete(key);
    this.store.set(key, { value, expires: Date.now() + ttlMs });
    while (this.store.size > this.maxEntries) {
      this.store.delete(this.store.keys().next().value); // oldest first
    }
  }

  /** Returns { value, cached }. Failed loads are never cached. */
  async wrap(key, loader, ttlMs = this.ttlMs) {
    const hit = this.get(key);
    if (hit !== undefined) return { value: hit, cached: true };
    if (this.inflight.has(key)) return { value: await this.inflight.get(key), cached: false };

    const promise = (async () => {
      const value = await loader();
      this.set(key, value, ttlMs);
      return value;
    })().finally(() => this.inflight.delete(key));

    this.inflight.set(key, promise);
    return { value: await promise, cached: false };
  }

  get size() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
    this.inflight.clear();
  }
}
