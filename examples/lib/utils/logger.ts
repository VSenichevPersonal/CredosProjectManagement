/**
 * @intent: Structured logging utility
 * @llm-note: All logs should go through this logger for consistency
 * @architecture: Centralized logging with context
 */

export interface LogContext {
  requestId?: string
  userId?: string
  organizationId?: string
  [key: string]: any
}

export interface Logger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string, error?: Error, meta?: Record<string, any>): void
}

/**
 * @intent: Create logger instance with context
 * @llm-note: Context is automatically included in all log messages
 */
export function createLogger(context: LogContext): Logger {
  const formatLog = (level: string, message: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...context,
      ...meta,
    }
    return logData
  }

  return {
    debug(message: string, meta?: Record<string, any>) {
      const log = formatLog("DEBUG", message, meta)
      console.log("[v0] DEBUG:", JSON.stringify(log))
    },

    info(message: string, meta?: Record<string, any>) {
      const log = formatLog("INFO", message, meta)
      console.log("[v0] INFO:", JSON.stringify(log))
    },

    warn(message: string, meta?: Record<string, any>) {
      const log = formatLog("WARN", message, meta)
      console.warn("[v0] WARN:", JSON.stringify(log))
    },

    error(message: string, error?: Error, meta?: Record<string, any>) {
      const log = formatLog("ERROR", message, {
        ...meta,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      })
      console.error("[v0] ERROR:", JSON.stringify(log))
    },
  }
}
