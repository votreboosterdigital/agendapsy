import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(20, '1 h'),
    })
  }
  return ratelimit
}

export async function checkRateLimit(
  identifier: string
): Promise<{ allowed: boolean }> {
  const rl = getRatelimit()
  if (!rl) return { allowed: true } // fail-open en dev
  const { success } = await rl.limit(identifier)
  return { allowed: success }
}
