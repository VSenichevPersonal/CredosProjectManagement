/**
 * @intent: Generate unique request ID for tracing
 * @llm-note: Used for correlating logs across services
 */

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
