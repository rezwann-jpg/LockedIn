import { sql } from 'drizzle-orm';
import db from '../config/db';

async function verify() {
    console.log('Verifying Database Enhancements...');

    try {
        // 1. Verify Full-Text Search Trigger on user_resumes
        console.log('--- Testing user_resumes Full-Text Search ---');
        const userRes = await db.execute(sql`SELECT id FROM users LIMIT 1`);
        const testUser = userRes.rows[0];
        if (!testUser) throw new Error('No user found to test resumes');

        const resumeRes = await db.execute(sql`
      INSERT INTO user_resumes (user_id, version_name, search_text, parsed_content)
      VALUES (${testUser.id}, 'Verification Test', 'Experienced Node.js developer with Drizzle ORM expertise', '{"skills": ["Node.js", "Drizzle"]}')
      RETURNING id, search_vector;
    `);

        console.log('Resume inserted. Search Vector:', resumeRes.rows[0].search_vector);

        // 2. Verify Application History Trigger
        console.log('--- Testing application_history Status Logging ---');
        const appRes = await db.execute(sql`SELECT id, status FROM applications LIMIT 1`);
        const testApp = appRes.rows[0];
        if (testApp) {
            await db.execute(sql`UPDATE applications SET status = 'reviewed' WHERE id = ${testApp.id}`);
            const historyRes = await db.execute(sql`SELECT * FROM application_history WHERE application_id = ${testApp.id}`);
            console.log('History Log Found:', historyRes.rows.length > 0 ? 'SUCCESS' : 'FAILURE');
            console.log('History Detail:', historyRes.rows[0]);
        } else {
            console.log('No application found to test status auditing.');
        }

        // 3. Verify Analytical View
        console.log('--- Testing category_demand_analytics View ---');
        const analytics = await db.execute(sql`SELECT * FROM category_demand_analytics LIMIT 3`);
        console.table(analytics.rows);

        console.log('Verification Completed.');
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verify();
