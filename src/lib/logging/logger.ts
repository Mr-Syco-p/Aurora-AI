import { LogEntry, Tier, ModelType } from '@/lib/ai/types';

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      ...entry,
    };

    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // In a production environment, you might want to:
    // - Save to a database
    // - Send to a logging service
    // - Write to a file
    console.log('AuroraAI Log:', logEntry);

    return logEntry;
  }

  logOrchestration(
    userId: string | undefined,
    tier: Tier,
    requestType: ModelType | 'mixed',
    input: string,
    selectedModel: string,
    allModels: string[],
    scores: Record<string, number>,
    tokensUsed: number,
    latency: number,
    success: boolean,
    error?: string
  ): LogEntry {
    return this.log({
      userId,
      tier,
      requestType,
      input: this.sanitizeInput(input),
      selectedModel,
      allModels,
      scores,
      tokensUsed,
      latency,
      success,
      error,
    });
  }

  getLogs(options?: {
    userId?: string;
    tier?: Tier;
    requestType?: ModelType | 'mixed';
    limit?: number;
    offset?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (options?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === options.userId);
    }

    if (options?.tier) {
      filteredLogs = filteredLogs.filter(log => log.tier === options.tier);
    }

    if (options?.requestType) {
      filteredLogs = filteredLogs.filter(log => log.requestType === options.requestType);
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return filteredLogs.slice(offset, offset + limit);
  }

  getLogStats(): {
    totalLogs: number;
    successRate: number;
    averageLatency: number;
    totalTokensUsed: number;
    modelUsage: Record<string, number>;
    tierUsage: Record<Tier, number>;
    requestTypeUsage: Record<string, number>;
  } {
    const logs = this.logs;
    
    if (logs.length === 0) {
      return {
        totalLogs: 0,
        successRate: 0,
        averageLatency: 0,
        totalTokensUsed: 0,
        modelUsage: {},
        tierUsage: { free: 0, paid: 0 },
        requestTypeUsage: {},
      };
    }

    const successfulLogs = logs.filter(log => log.success);
    const totalLatency = logs.reduce((sum, log) => sum + log.latency, 0);
    const totalTokens = logs.reduce((sum, log) => sum + log.tokensUsed, 0);

    const modelUsage: Record<string, number> = {};
    const tierUsage: Record<Tier, number> = { free: 0, paid: 0 };
    const requestTypeUsage: Record<string, number> = {};

    logs.forEach(log => {
      // Model usage
      modelUsage[log.selectedModel] = (modelUsage[log.selectedModel] || 0) + 1;
      
      // Tier usage
      tierUsage[log.tier] = (tierUsage[log.tier] || 0) + 1;
      
      // Request type usage
      requestTypeUsage[log.requestType] = (requestTypeUsage[log.requestType] || 0) + 1;
    });

    return {
      totalLogs: logs.length,
      successRate: (successfulLogs.length / logs.length) * 100,
      averageLatency: totalLatency / logs.length,
      totalTokensUsed: totalTokens,
      modelUsage,
      tierUsage,
      requestTypeUsage,
    };
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private sanitizeInput(input: string): string {
    // Remove sensitive information and limit length
    const maxLength = 200;
    if (input.length > maxLength) {
      return input.substring(0, maxLength) + '...';
    }
    
    // Remove potential API keys or sensitive data
    return input.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
               .replace(/api[_-]?key[_-]?[a-zA-Z0-9]{10,}/gi, '[REDACTED]');
  }
}

export const logger = Logger.getInstance();
