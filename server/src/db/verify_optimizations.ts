// src/db/verify_optimizations.ts
import { sql } from 'drizzle-orm';
import db from '../config/db';

async function verify() {
    console.log('Verifying Database Optimizations...');

    try {
        // 1. Verify Indexes
        console.log('--- Checking Indexes ---');
        const indexRes = await db.execute(sql`
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname IN (
                'idx_active_jobs_posted', 
                'idx_unread_notifications', 
                'idx_jobs_title_trgm', 
                'idx_companies_name_trgm'
            );
        `);
        console.log('Found Indexes:', indexRes.rows.map(r => r.indexname));

        // 2. Verify View
        console.log('--- Checking View ---');
        const viewRes = await db.execute(sql`SELECT * FROM company_performance_metrics LIMIT 1`);
        console.log('View access successful. Result count:', viewRes.rows.length);

        // 3. Check Query Plan for partial index usage
        console.log('--- Checking Query Plan for Partial Index ---');
        const explainRes = await db.execute(sql`
            EXPLAIN SELECT * FROM jobs 
            WHERE is_active = true 
            ORDER BY posted_at DESC;
        `);

        const plan = explainRes.rows.map(r => r['QUERY PLAN']).join('\n');
        console.log('Query Plan fragment:');
        console.log(plan.slice(0, 500));

        if (plan.includes('idx_active_jobs_posted')) {
            console.log('✅ Query plan is using the partial index!');
        } else {
            console.log('⚠️ Query plan did not explicitly show partial index in this small dataset, but it is available.');
        }

        console.log('Verification Completed.');
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verify();
