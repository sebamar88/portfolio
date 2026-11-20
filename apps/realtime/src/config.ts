export interface AppConfig {
  redisUrl: string;
  port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (!env.REDIS_URL) throw new Error('REDIS_URL is required (e.g. redis://localhost:6379)');
  const port = env.PORT ? Number(env.PORT) : 3001;
  if (!Number.isInteger(port) || port < 0) throw new Error(`Invalid PORT: ${env.PORT}`);
  return { redisUrl: env.REDIS_URL, port };
}
