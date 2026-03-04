// src/db/migrate.ts
import { setupExtensions } from './scripts/setup/extensions';
import { setupTriggers } from './scripts/setup/triggers';
import { setupOptimizations } from './scripts/setup/optimizations';
import { setupAdvanced } from './scripts/setup/advanced';
import { setupSubscriptions } from './scripts/setup/subscriptions';

async function migrate() {
    console.log('🚀 Starting Database Migration & Setup...');

    try {
        await setupSubscriptions();
        await setupExtensions();
        await setupTriggers();
        await setupOptimizations();
        await setupAdvanced();

        console.log('✅ Database Migration Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
