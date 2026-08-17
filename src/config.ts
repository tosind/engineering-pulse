export const config = {
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
