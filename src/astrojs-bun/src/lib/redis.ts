import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse redis:// URL to connection options
function parseRedisUrl(url: string) {
  const match = url.match(/redis:\/\/(?:([^:]+)(?::([^@]+))?@)?([^:]+):(\d+)/);
  if (match) {
    return {
      host: match[3] || 'localhost',
      port: parseInt(match[4]) || 6379,
      password: match[2] || undefined,
    };
  }
  return { host: 'localhost', port: 6379 };
}

const options = parseRedisUrl(redisUrl);

export const redis = new Redis({
  host: options.host,
  port: options.port,
  password: options.password,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});