type LogLevel = "trace" | "debug" | "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment = typeof window === "undefined" ? process.env.NODE_ENV === "development" : false
  private isClient = typeof window !== "undefined"

  private minLevel: LogLevel = (
    typeof window === "undefined" ? (process.env.LOG_LEVEL as LogLevel) || "trace" : "trace"
  ) as LogLevel

  private levelPriority: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel]
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ""
    const errorStr = error ? ` | Error: ${error.message}\n${error.stack}` : ""
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    }

    const formattedLog = this.formatLog(entry)

    // Console output with colors
    const colors = {
      trace: "\x1b[90m", // Gray
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
    }
    const reset = "\x1b[0m"

    if (this.isClient) {
      const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log
      consoleMethod(`${colors[level]}${formattedLog}${reset}`)
      return
    }

    if (this.isDevelopment || level === "error" || level === "warn") {
      console.log(`${colors[level]}${formattedLog}${reset}`)
    }

    // In production, you would send to logging service (e.g., Sentry, LogRocket)
    if (!this.isDevelopment && (level === "error" || level === "warn")) {
      // TODO: Send to external logging service
    }
  }

  trace(message: string, context?: Record<string, unknown>) {
    this.log("trace", message, context)
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log("error", message, context, error)
  }
}

export const logger = new Logger()
