/**
 * @intent: Logger service for application logging
 * @llm-note: Centralized logging with structured metadata
 * @architecture: Service layer - handles all logging operations
 */

import type { Logger } from '@/lib/context/execution-context'

export class LoggerServiceImpl implements Logger {
  private prefix: string

  constructor(prefix = '[CredosPM]') {
    this.prefix = prefix
  }

  info(message: string, meta?: any): void {
    console.log(`${this.prefix} [INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
  }

  warn(message: string, meta?: any): void {
    console.warn(`${this.prefix} [WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
  }

  error(message: string, meta?: any): void {
    console.error(`${this.prefix} [ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.prefix} [DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
    }
  }
}
