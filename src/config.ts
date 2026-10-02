export const config = {
  host: process.env.HOST || '127.0.0.1',
  apiToken: process.env.PULSE_API_TOKEN || '',
  production: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 3088),
  databasePath: process.env.DATABASE_PATH || './data/engineering-pulse.db',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  demoMode: process.env.DEMO_MODE === '1' || !process.env.OPENROUTER_API_KEY,
  models: {
    frontend: process.env.FE_MODEL || 'deepseek/deepseek-chat-v3.1',
    backend: process.env.BE_MODEL || 'deepseek/deepseek-chat-v3.1',
    lead: process.env.LEAD_MODEL || 'deepseek/deepseek-r1'
  }
};

export function validateServerConfig() {
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('Invalid PORT');
  if (config.production && config.apiToken.length < 32) throw new Error('Production requires PULSE_API_TOKEN of at least 32 characters');
  if (config.production && config.demoMode) throw new Error('Production requires OPENROUTER_API_KEY and DEMO_MODE disabled');
  if (config.production && !process.env.GITHUB_REPOSITORIES?.trim()) throw new Error('Production requires a GITHUB_REPOSITORIES allowlist');
}
