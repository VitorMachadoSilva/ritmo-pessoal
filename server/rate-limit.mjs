const limitResponse = (res, seconds, message = "Muitas solicitações. Aguarde um pouco e tente novamente.") => {
  const retryAfter = Math.max(1, Math.ceil(seconds));
  res.set("Retry-After", String(retryAfter));
  return res.status(429).json({ error: message, retryAfter });
};

export function createTokenBucketLimiter({ capacity, refillPerSecond, key = (req) => req.ip || req.socket.remoteAddress || "unknown", now = Date.now, message } = {}) {
  const buckets = new Map();
  let requests = 0;
  const middleware = (req, res, next) => {
    const time = now();
    const id = key(req);
    let bucket = buckets.get(id);
    if (!bucket) bucket = { tokens: capacity, updatedAt: time };
    bucket.tokens = Math.min(capacity, bucket.tokens + Math.max(0, time - bucket.updatedAt) / 1000 * refillPerSecond);
    bucket.updatedAt = time;
    requests++;
    if ((requests & 255) === 0)
      for (const [bucketId, entry] of buckets)
        if (time - entry.updatedAt > capacity / refillPerSecond * 1000) buckets.delete(bucketId);
    if (bucket.tokens < 1) {
      buckets.set(id, bucket);
      return limitResponse(res, (1 - bucket.tokens) / refillPerSecond, message);
    }
    bucket.tokens--;
    buckets.set(id, bucket);
    if (buckets.size > 10000) buckets.delete(buckets.keys().next().value);
    next();
  };
  return { middleware, buckets };
}

export function createRequestRateLimits(options = {}) {
  return {
    api: createTokenBucketLimiter({ capacity: 30, refillPerSecond: 2, message: "O Ritmo está recebendo muitas solicitações. Aguarde um instante e tente novamente.", ...options.api }),
    mutations: createTokenBucketLimiter({ capacity: 10, refillPerSecond: 40 / 60, message: "Muitas alterações em pouco tempo. Aguarde um instante e tente novamente.", ...options.mutations }),
    import: (() => {
      let lastStartedAt = -Infinity;
      let active = false;
      const intervalMs = options.import?.intervalMs ?? 60000;
      const now = options.import?.now ?? Date.now;
      return {
        middleware(req, res, next) {
          const wait = intervalMs - (now() - lastStartedAt);
          if (active || wait > 0) return limitResponse(res, active ? 5 : wait / 1000, "Aguarde antes de tentar restaurar outro backup.");
          active = true;
          lastStartedAt = now();
          res.once("finish", () => { active = false; });
          res.once("close", () => { active = false; });
          next();
        },
      };
    })(),
  };
}

export function createLoginRateLimit({ maxFailures = 10, windowMs = 15 * 60000, now = Date.now } = {}) {
  const failures = new Map();
  const middleware = (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const current = failures.get(key);
    const time = now();
    if (current && current.until > time && current.count >= maxFailures)
      return limitResponse(res, (current.until - time) / 1000, "Muitas tentativas de acesso. Aguarde antes de tentar novamente.");
    res.once("finish", () => {
      if (res.statusCode === 401) {
        const record = failures.get(key);
        if (!record || record.until <= now()) failures.set(key, { count: 1, until: now() + windowMs });
        else record.count++;
        if (failures.size > 10000) failures.delete(failures.keys().next().value);
      }
    });
    next();
  };
  return { middleware, clear: (key) => failures.delete(key), failures };
}
