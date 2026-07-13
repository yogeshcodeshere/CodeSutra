class TtlCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = { TtlCache, cache: new TtlCache() };
