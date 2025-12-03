/**
 * WhatsApp Rate Limiter
 * Prevents sending too many messages in a short time
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private maxMessagesPerMinute = 20;
  private maxMessagesPerHour = 100;
  private maxMessagesPerDay = 500;
  private cleanupIntervalMs = 5 * 60 * 1000; // 5 minutes

  static getInstance(): RateLimiter {
    if (!this.instance) {
      this.instance = new RateLimiter();
      this.instance.startCleanup();
    }
    return this.instance;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.cleanupIntervalMs);
    
    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove expired entries from the limits map
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;
    const keysToDelete: string[] = [];
    
    this.limits.forEach((entry, key) => {
      if (now >= entry.resetAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.limits.delete(key);
      removedCount++;
    });
    
    if (removedCount > 0) {
      console.log(`[RateLimiter] Cleaned up ${removedCount} expired entries`);
    }
  }

  /**
   * Check if message can be sent (respects rate limits)
   */
  canSend(jid: string): { allowed: boolean; retryAfter?: number; reason?: string } {
    const now = Date.now();
    const minuteKey = `${jid}:minute`;
    const hourKey = `${jid}:hour`;
    const dayKey = `${jid}:day`;

    // Check minute limit
    const minuteLimit = this.checkLimit(minuteKey, now, 60 * 1000, this.maxMessagesPerMinute);
    if (!minuteLimit.allowed) {
      return { 
        allowed: false, 
        retryAfter: minuteLimit.retryAfter,
        reason: `تجاوزت الحد الأقصى للرسائل في الدقيقة (${this.maxMessagesPerMinute})`
      };
    }

    // Check hour limit
    const hourLimit = this.checkLimit(hourKey, now, 60 * 60 * 1000, this.maxMessagesPerHour);
    if (!hourLimit.allowed) {
      return { 
        allowed: false, 
        retryAfter: hourLimit.retryAfter,
        reason: `تجاوزت الحد الأقصى للرسائل في الساعة (${this.maxMessagesPerHour})`
      };
    }

    // Check day limit
    const dayLimit = this.checkLimit(dayKey, now, 24 * 60 * 60 * 1000, this.maxMessagesPerDay);
    if (!dayLimit.allowed) {
      return { 
        allowed: false, 
        retryAfter: dayLimit.retryAfter,
        reason: `تجاوزت الحد الأقصى للرسائل في اليوم (${this.maxMessagesPerDay})`
      };
    }

    return { allowed: true };
  }

  /**
   * Record a sent message
   */
  recordSent(jid: string): void {
    const now = Date.now();
    const minuteKey = `${jid}:minute`;
    const hourKey = `${jid}:hour`;
    const dayKey = `${jid}:day`;

    this.incrementLimit(minuteKey, now, 60 * 1000);
    this.incrementLimit(hourKey, now, 60 * 60 * 1000);
    this.incrementLimit(dayKey, now, 24 * 60 * 60 * 1000);
  }

  /**
   * Get current usage stats
   */
  getStats(jid: string): { minute: number; hour: number; day: number } {
    const now = Date.now();
    return {
      minute: this.getCount(`${jid}:minute`, now, 60 * 1000),
      hour: this.getCount(`${jid}:hour`, now, 60 * 60 * 1000),
      day: this.getCount(`${jid}:day`, now, 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Configure limits
   */
  configure(options: {
    maxMessagesPerMinute?: number;
    maxMessagesPerHour?: number;
    maxMessagesPerDay?: number;
  }): void {
    if (options.maxMessagesPerMinute) {
      this.maxMessagesPerMinute = options.maxMessagesPerMinute;
    }
    if (options.maxMessagesPerHour) {
      this.maxMessagesPerHour = options.maxMessagesPerHour;
    }
    if (options.maxMessagesPerDay) {
      this.maxMessagesPerDay = options.maxMessagesPerDay;
    }
  }

  private checkLimit(key: string, now: number, windowMs: number, maxCount: number): { allowed: boolean; retryAfter?: number } {
    const entry = this.limits.get(key);
    
    if (!entry || now >= entry.resetAt) {
      return { allowed: true };
    }

    if (entry.count >= maxCount) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil((entry.resetAt - now) / 1000) 
      };
    }

    return { allowed: true };
  }

  private incrementLimit(key: string, now: number, windowMs: number): void {
    const entry = this.limits.get(key);
    
    if (!entry || now >= entry.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
    }
  }

  private getCount(key: string, now: number, windowMs: number): number {
    const entry = this.limits.get(key);
    
    if (!entry || now >= entry.resetAt) {
      return 0;
    }

    return entry.count;
  }

  /**
   * Clear all limits (for testing)
   */
  clear(): void {
    this.limits.clear();
  }

  /**
   * Get the number of entries in the limits map
   */
  getEntryCount(): number {
    return this.limits.size;
  }
}

export const rateLimiter = RateLimiter.getInstance();
