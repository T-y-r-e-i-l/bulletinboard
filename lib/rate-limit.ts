import { RATE_LIMIT_PER_MINUTE } from "@/lib/constants"

type Bucket = { timestamps: number[] }

const g = globalThis as typeof globalThis & { __rateLimit?: Map<string, Bucket> }
const buckets = g.__rateLimit ?? new Map<string, Bucket>()
g.__rateLimit = buckets

export function rateLimit(ip: string, limit = RATE_LIMIT_PER_MINUTE) {
  const now = Date.now()
  const windowStart = now - 60_000
  const bucket = buckets.get(ip) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart)
  if (bucket.timestamps.length >= limit) {
    buckets.set(ip, bucket)
    return false
  }
  bucket.timestamps.push(now)
  buckets.set(ip, bucket)
  return true
}
