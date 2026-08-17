import { config } from './config';
import { seedDatabase } from './db/database';
import { ReviewPipeline } from './orchestration/reviewPipeline';

async function main() {
  seedDatabase(true);
  console.log(`Seeded mock team. Running all PRs in ${config.demoMode ? 'deterministic demo' : 'live OpenRouter'} mode...`);
  const reviews = await new ReviewPipeline().runAll();
  console.log(`Processed ${reviews.length} PRs successfully.`);
}

main().catch((error: any) => { console.error(error); process.exit(1); });
