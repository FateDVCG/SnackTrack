import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_RETRIES = 3;

class AnalyticsCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new AnalyticsCache();

export const analyticsService = {
  async getAnalytics(timeRange = "day", forceRefresh = false) {
    const cacheKey = `analytics_${timeRange}`;

    if (!forceRefresh) {
      const cachedData = cache.get(cacheKey);
      if (cachedData) return cachedData;
    }

    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get(`${API_BASE_URL}/analytics`, {
          params: { range: timeRange },
        });

        const data = response.data;
        cache.set(cacheKey, data);
        return data;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES - 1) {
          // Wait for a bit before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
          continue;
        }
      }
    }

    // If we get here, all retries failed
    throw lastError;
  },

  clearCache() {
    cache.clear();
  },
};
