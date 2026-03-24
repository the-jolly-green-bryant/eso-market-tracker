import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
})

export const orThrow = (err: Error) => {
  throw err
}

export const getIdFromName = (name: string): number => {
  name = name.toLowerCase().replace(/[^a-z0-9 ]/gi, '')
  let hash = 0x811c9dc5

  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

export const attempt = <T>(fn: () => T, fallback: T | null): T | null => {
  try {
    return fn()
  } catch {
    return fallback
  }
}
