import { Tier, RateLimitConfig } from './types';
import { TIER_CONFIGS } from '@/lib/tiers/tiers';

interface RateLimitEntry {
  requests: number;
  tokens: number;
  windowStart: number;
  hourlyTokens: number;
  hourlyWindowStart: number;
  dailyRequests?: number;
  dailyWindowStart?: number;
  violations: number;
  lastViolationTime?: number;
  blockedUntil?: number;
}

interface RateLimitResult {
  ok: boolean;
  reason?: string;
  remaining?: {
    requests: number;
    tokens: number;
    hourly: number;
    daily?: number;
  };
  resetTime?: number;
  retryAfter?: number;
  violationCount?: number;
}

interface RateLimitStatus {
  current: {
    requests: number;
    tokens: number;
    hourlyTokens: number;
    dailyRequests?: number;
  };
  remaining: {
    requests: number;
    tokens: number;
    hourly: number;
    daily?: number;
  };
  windows: {
    minute: { start: number; reset: number };
    hourly: { start: number; reset: number };
    daily: { start: number; reset: number };
  };
  violations: number;
  isBlocked: boolean;
  blockedUntil?: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private readonly MINUTE_WINDOW = 60 * 1000; // 1 minute
  private readonly HOUR_WINDOW = 60 * 60 * 1000; // 1 hour
  private readonly DAY_WINDOW = 24 * 60 * 60 * 1000; // 1 day
  private readonly VIOLATION_PENALTY = 5 * 60 * 1000; // 5 minutes block per violation
  private readonly MAX_VIOLATIONS = 5; // Max violations before extended block
  private readonly EXTENDED_PENALTY = 60 * 60 * 1000; // 1 hour for repeated violations

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  checkAndConsumeQuota(context: {
    userId?: string;
    ip?: string;
    tier: Tier;
    tokensUsed?: number;
    endpoint?: string;
    modelType?: 'text' | 'image' | 'realtime' | 'mixed';
  }): RateLimitResult {
    const key = context.userId || context.ip || 'anonymous';
    const config = TIER_CONFIGS[context.tier].rateLimit;
    const now = Date.now();

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key);
    if (!entry) {
      entry = this.createFreshEntry(now);
      this.rateLimitStore.set(key, entry);
    }

    // Check if user is blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        ok: false,
        reason: 'User temporarily blocked due to repeated violations',
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
        remaining: this.getRemainingCounts(entry, config),
        violationCount: entry.violations,
      };
    }

    // Reset windows if needed
    this.resetWindowsIfNeeded(entry, now);

    // Check all limits
    const checks = [
      this.checkMinuteLimit(entry, config),
      this.checkHourlyLimit(entry, config, context.tokensUsed || 0),
      this.checkDailyLimit(entry, config),
    ];

    const failedCheck = checks.find(check => !check.ok);
    if (failedCheck) {
      this.handleViolation(entry, now);
      return failedCheck as RateLimitResult;
    }

    // Consume quota
    entry.requests++;
    entry.tokens += context.tokensUsed || 0;
    entry.hourlyTokens += context.tokensUsed || 0;
    if (entry.dailyRequests !== undefined) {
      entry.dailyRequests++;
    }

    return {
      ok: true,
      remaining: this.getRemainingCounts(entry, config),
      resetTime: entry.windowStart + this.MINUTE_WINDOW,
    };
  }

  private createFreshEntry(now: number): RateLimitEntry {
    return {
      requests: 0,
      tokens: 0,
      windowStart: now,
      hourlyTokens: 0,
      hourlyWindowStart: now,
      dailyRequests: 0,
      dailyWindowStart: now,
      violations: 0,
    };
  }

  private resetWindowsIfNeeded(entry: RateLimitEntry, now: number): void {
    // Reset minute window
    if (now - entry.windowStart > this.MINUTE_WINDOW) {
      entry.requests = 0;
      entry.tokens = 0;
      entry.windowStart = now;
    }

    // Reset hourly window
    if (now - entry.hourlyWindowStart > this.HOUR_WINDOW) {
      entry.hourlyTokens = 0;
      entry.hourlyWindowStart = now;
    }

    // Reset daily window
    if (entry.dailyWindowStart && now - entry.dailyWindowStart > this.DAY_WINDOW) {
      entry.dailyRequests = 0;
      entry.dailyWindowStart = now;
    }
  }

  private checkMinuteLimit(entry: RateLimitEntry, config: RateLimitConfig): RateLimitResult {
    if (entry.requests >= config.requestsPerMinute) {
      return {
        ok: false,
        reason: 'Rate limit exceeded: too many requests per minute',
        remaining: { requests: 0, tokens: 0, hourly: 0 },
        resetTime: entry.windowStart + this.MINUTE_WINDOW,
        retryAfter: Math.ceil((entry.windowStart + this.MINUTE_WINDOW - Date.now()) / 1000),
      };
    }
    return { ok: true };
  }

  private checkHourlyLimit(entry: RateLimitEntry, config: RateLimitConfig, tokensUsed: number): RateLimitResult {
    if (config.tokensPerHour && entry.hourlyTokens + tokensUsed > config.tokensPerHour) {
      return {
        ok: false,
        reason: 'Rate limit exceeded: too many tokens per hour',
        remaining: { requests: 0, tokens: 0, hourly: 0 },
        resetTime: entry.hourlyWindowStart + this.HOUR_WINDOW,
        retryAfter: Math.ceil((entry.hourlyWindowStart + this.HOUR_WINDOW - Date.now()) / 1000),
      };
    }
    return { ok: true };
  }

  private checkDailyLimit(entry: RateLimitEntry, config: RateLimitConfig): RateLimitResult {
    if (config.requestsPerDay && entry.dailyRequests! >= config.requestsPerDay) {
      return {
        ok: false,
        reason: 'Rate limit exceeded: too many requests per day',
        remaining: { requests: 0, tokens: 0, hourly: 0 },
        resetTime: entry.dailyWindowStart! + this.DAY_WINDOW,
        retryAfter: Math.ceil((entry.dailyWindowStart! + this.DAY_WINDOW - Date.now()) / 1000),
      };
    }
    return { ok: true };
  }

  private handleViolation(entry: RateLimitEntry, now: number): void {
    entry.violations++;
    entry.lastViolationTime = now;

    // Calculate penalty based on violation count
    let penalty = this.VIOLATION_PENALTY;
    if (entry.violations >= this.MAX_VIOLATIONS) {
      penalty = this.EXTENDED_PENALTY;
    }

    entry.blockedUntil = now + penalty;
  }

  private getRemainingCounts(entry: RateLimitEntry, config: RateLimitConfig) {
    return {
      requests: Math.max(0, config.requestsPerMinute - entry.requests),
      tokens: Math.max(0, (config.tokensPerHour || 0) - entry.tokens),
      hourly: Math.max(0, (config.tokensPerHour || 0) - entry.hourlyTokens),
      daily: config.requestsPerDay ? Math.max(0, config.requestsPerDay - (entry.dailyRequests || 0)) : undefined,
    };
  }

  // Enhanced status method
  getStatus(key: string, tier: Tier): RateLimitStatus {
    const entry = this.rateLimitStore.get(key);
    const config = TIER_CONFIGS[tier].rateLimit;
    const now = Date.now();

    if (!entry) {
      const freshEntry = this.createFreshEntry(now);
      return {
        current: {
          requests: 0,
          tokens: 0,
          hourlyTokens: 0,
          dailyRequests: 0,
        },
        remaining: {
          requests: config.requestsPerMinute,
          tokens: config.tokensPerHour || 0,
          hourly: config.tokensPerHour || 0,
          daily: config.requestsPerDay || 0,
        },
        windows: {
          minute: { start: now, reset: now + this.MINUTE_WINDOW },
          hourly: { start: now, reset: now + this.HOUR_WINDOW },
          daily: { start: now, reset: now + this.DAY_WINDOW },
        },
        violations: 0,
        isBlocked: false,
      };
    }

    this.resetWindowsIfNeeded(entry, now);

    return {
      current: {
        requests: entry.requests,
        tokens: entry.tokens,
        hourlyTokens: entry.hourlyTokens,
        dailyRequests: entry.dailyRequests,
      },
      remaining: this.getRemainingCounts(entry, config),
      windows: {
        minute: { start: entry.windowStart, reset: entry.windowStart + this.MINUTE_WINDOW },
        hourly: { start: entry.hourlyWindowStart, reset: entry.hourlyWindowStart + this.HOUR_WINDOW },
        daily: { start: entry.dailyWindowStart!, reset: entry.dailyWindowStart! + this.DAY_WINDOW },
      },
      violations: entry.violations,
      isBlocked: !!(entry.blockedUntil && now < entry.blockedUntil),
      blockedUntil: entry.blockedUntil,
    };
  }

  // Advanced features
  getTopViolators(limit: number = 10): Array<{ key: string; violations: number; lastViolation: number }> {
    const violators = Array.from(this.rateLimitStore.entries())
      .filter(([_, entry]) => entry.violations > 0)
      .map(([key, entry]) => ({
        key,
        violations: entry.violations,
        lastViolation: entry.lastViolationTime || 0,
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, limit);

    return violators;
  }

  getUsageStats(): {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    totalRequests: number;
    totalTokens: number;
    averageRequestsPerUser: number;
    violationRate: number;
  } {
    const now = Date.now();
    const entries = Array.from(this.rateLimitStore.values());
    
    const activeUsers = entries.filter(entry => 
      now - entry.windowStart < this.MINUTE_WINDOW
    ).length;

    const blockedUsers = entries.filter(entry => 
      entry.blockedUntil && now < entry.blockedUntil
    ).length;

    const totalRequests = entries.reduce((sum, entry) => sum + entry.requests, 0);
    const totalTokens = entries.reduce((sum, entry) => sum + entry.tokens, 0);
    const totalViolations = entries.reduce((sum, entry) => sum + entry.violations, 0);

    return {
      totalUsers: this.rateLimitStore.size,
      activeUsers,
      blockedUsers,
      totalRequests,
      totalTokens,
      averageRequestsPerUser: this.rateLimitStore.size > 0 ? totalRequests / this.rateLimitStore.size : 0,
      violationRate: totalRequests > 0 ? (totalViolations / totalRequests) * 100 : 0,
    };
  }

  // Admin functions
  unblockUser(key: string): boolean {
    const entry = this.rateLimitStore.get(key);
    if (entry && entry.blockedUntil) {
      entry.blockedUntil = undefined;
      entry.violations = 0;
      return true;
    }
    return false;
  }

  resetUserQuota(key: string): boolean {
    const entry = this.rateLimitStore.get(key);
    if (entry) {
      const now = Date.now();
      Object.assign(entry, this.createFreshEntry(now));
      return true;
    }
    return false;
  }

  // Cleanup old entries (call this periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      // Remove entries that haven't been used for 24 hours
      if (now - entry.windowStart > this.DAY_WINDOW && 
          now - entry.hourlyWindowStart > this.HOUR_WINDOW &&
          (!entry.dailyWindowStart || now - entry.dailyWindowStart > this.DAY_WINDOW)) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  // Export/Import for persistence
  export(): string {
    const data = Array.from(this.rateLimitStore.entries()).map(([key, entry]) => ({
      key,
      ...entry,
    }));
    return JSON.stringify(data);
  }

  import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      parsed.forEach((item: any) => {
        this.rateLimitStore.set(item.key, {
          requests: item.requests,
          tokens: item.tokens,
          windowStart: item.windowStart,
          hourlyTokens: item.hourlyTokens,
          hourlyWindowStart: item.hourlyWindowStart,
          dailyRequests: item.dailyRequests,
          dailyWindowStart: item.dailyWindowStart,
          violations: item.violations,
          lastViolationTime: item.lastViolationTime,
          blockedUntil: item.blockedUntil,
        });
      });
    } catch (error) {
      console.error('Failed to import rate limit data:', error);
    }
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
