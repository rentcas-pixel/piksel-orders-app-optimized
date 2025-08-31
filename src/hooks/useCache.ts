import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of cache entries
}

export function useCache<T>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 50 } = options; // Default 5 minutes, max 50 entries
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  const get = useCallback((key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Entry expired, remove it
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    return entry.data;
  }, [cache]);

  const set = useCallback((key: string, data: T, customTtl?: number) => {
    const entryTtl = customTtl || ttl;
    
    setCache(prev => {
      const newCache = new Map(prev);
      
      // Check if we need to remove old entries
      if (newCache.size >= maxSize) {
        // Remove oldest entries
        const entries = Array.from(newCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove oldest 20% of entries
        const toRemove = Math.ceil(maxSize * 0.2);
        for (let i = 0; i < toRemove; i++) {
          newCache.delete(entries[i][0]);
        }
      }
      
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: entryTtl
      });
      
      return newCache;
    });
  }, [ttl, maxSize]);

  const has = useCallback((key: string): boolean => {
    return get(key) !== null;
  }, [get]);

  const remove = useCallback((key: string) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  }, []);

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  const size = useCallback(() => {
    return cache.size;
  }, [cache]);

  // Cleanup expired entries periodically
  const cleanup = useCallback(() => {
    const now = Date.now();
    setCache(prev => {
      const newCache = new Map(prev);
      for (const [key, entry] of newCache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          newCache.delete(key);
        }
      }
      return newCache;
    });
  }, []);

  // Set up periodic cleanup
  const startCleanup = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }
    
    cleanupTimeoutRef.current = setInterval(cleanup, 60000); // Cleanup every minute
  }, [cleanup]);

  const stopCleanup = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearInterval(cleanupTimeoutRef.current);
    }
  }, []);

  return {
    get,
    set,
    has,
    remove,
    clear,
    size,
    startCleanup,
    stopCleanup
  };
}
