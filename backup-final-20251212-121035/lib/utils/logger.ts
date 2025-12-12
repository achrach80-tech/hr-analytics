/**
 * 🔍 TALVIO LOGGER - Production-Ready Logging System
 * 
 * Niveaux de log:
 * - DEBUG: Informations de développement (désactivé en production)
 * - INFO: Informations générales
 * - WARN: Avertissements (données manquantes, etc.)
 * - ERROR: Erreurs critiques
 * 
 * Usage:
 * import { logger } from '@/lib/utils/logger'
 * logger.debug('Message', { data }, 'Context')
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = string

interface LogConfig {
  enabled: boolean
  level: LogLevel
  contexts: Set<string>
}

class Logger {
  private config: LogConfig

  constructor() {
    this.config = {
      enabled: true,
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      contexts: new Set()
    }
  }

  configure(config: Partial<LogConfig>) {
    this.config = { ...this.config, ...config }
  }

  private shouldLog(level: LogLevel, context?: LogContext): boolean {
    if (!this.config.enabled) return false
    
    if (context && this.config.contexts.size > 0) {
      if (!this.config.contexts.has(context)) return false
    }

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentIndex = levels.indexOf(this.config.level)
    const messageIndex = levels.indexOf(level)
    
    return messageIndex >= currentIndex
  }

  private format(level: LogLevel, context: LogContext | undefined, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level]
    
    const ctx = context ? `[${context}]` : ''
    return `${emoji} ${timestamp} ${ctx} ${message}`
  }

  debug(message: string, data?: any, context?: LogContext) {
    if (!this.shouldLog('debug', context)) return
    console.log(this.format('debug', context, message), data || '')
  }

  info(message: string, data?: any, context?: LogContext) {
    if (!this.shouldLog('info', context)) return
    console.info(this.format('info', context, message), data || '')
  }

  warn(message: string, data?: any, context?: LogContext) {
    if (!this.shouldLog('warn', context)) return
    console.warn(this.format('warn', context, message), data || '')
  }

  error(message: string, error?: any, context?: LogContext) {
    if (!this.shouldLog('error', context)) return
    console.error(this.format('error', context, message), error || '')
  }

  group(title: string, fn: () => void, context?: LogContext) {
    if (!this.shouldLog('debug', context)) {
      fn()
      return
    }
    
    console.groupCollapsed(this.format('debug', context, title))
    fn()
    console.groupEnd()
  }

  time(label: string, context?: LogContext) {
    if (!this.shouldLog('debug', context)) return
    console.time(`⏱️ ${context ? `[${context}]` : ''} ${label}`)
  }

  timeEnd(label: string, context?: LogContext) {
    if (!this.shouldLog('debug', context)) return
    console.timeEnd(`⏱️ ${context ? `[${context}]` : ''} ${label}`)
  }
}

export const logger = new Logger()

if (process.env.NODE_ENV === 'production') {
  logger.configure({
    level: 'error',
    enabled: true
  })
}

export type { LogLevel, LogContext }