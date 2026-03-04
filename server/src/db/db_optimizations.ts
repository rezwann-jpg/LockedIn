// src/db/db_optimizations.ts
// Run with: npx ts-node src/db/db_optimizations.ts
import { sql } from 'drizzle-orm';
import db from '../config/db';

async function main() {
    console.log('Pushing Database Optimizations (Indexes & Views)...');

    try {
        // 1. Extensions
        console.log('Enabling pg_trgm extension...');
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

        // 2. Partial Indexes for Performance
        console.log('Creating partial index: idx_active_jobs_posted...');
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_active_jobs_posted 
            ON jobs(posted_at DESC) 
            WHERE is_active = true;
        `);

        console.log('Creating partial index: idx_unread_notifications...');
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_unread_notifications 
            ON notifications(user_id, created_at DESC) 
            WHERE is_read = false;
        `);

        // 3. Trigram Indexes for Fuzzy Search
        console.log('Creating trigram indexes for fuzzy search...');
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
        `);
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin (name gin_trgm_ops);
        `);

        // 4. Analytics View: Company Performance
        console.log('Creating view: company_performance_metrics...');
        await db.execute(sql`
            CREATE OR REPLACE VIEW company_performance_metrics AS
            SELECT 
                c.id as company_id,
                c.name as company_name,
                COUNT(DISTINCT j.id) as total_jobs_posted,
                COALESCE(SUM(j.application_count), 0) as total_applications_received,
                COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('hired', 'offered')) as total_hires,
                CASE 
                    WHEN COALESCE(SUM(j.application_count), 0) = 0 THEN 0
                    ELSE ROUND((COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('hired', 'offered'))::numeric / NULLIF(SUM(j.application_count), 0)) * 100, 2)
                END as conversion_rate
            FROM companies c
            LEFT JOIN jobs j ON c.id = j.company_id
            LEFT JOIN applications a ON j.id = a.job_id
            GROUP BY c.id, c.name;
        `);

        console.log('Database Optimizations setup completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to setup database optimizations:', err);
        process.exit(1);
    }
}

main();
