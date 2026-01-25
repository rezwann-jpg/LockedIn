import db from '../config/db';
import { users, companies, jobs, skills, userSkills, jobSkills, applications } from './schema';
import { matchJobsForUser } from './queries';
import { sql, eq } from 'drizzle-orm';

async function main() {
    console.log('--- STARTING VERIFICATION ---');

    try {
        console.log('Cleaning up old test data...');
        await db.delete(applications);
        await db.delete(jobSkills);
        await db.delete(userSkills);
        await db.delete(jobs);
        await db.delete(companies);
        await db.delete(users);
        await db.delete(skills);

        console.log('Seeding skills...');
        const skillNames = ['Node.js', 'React', 'Python', 'AWS', 'SQL'];
        const skillMap = new Map();
        for (const name of skillNames) {
            const [inserted] = await db.insert(skills).values({ name }).returning();
            skillMap.set(name, inserted.id);
        }

        console.log('Seeding user...');
        const [user] = await db.insert(users).values({
            email: 'test@example.com',
            name: 'Test User',
            passwordHash: 'hash',
            role: 'job_seeker'
        }).returning();

        await db.insert(userSkills).values([
            { userId: user.id, skillId: skillMap.get('Node.js') },
            { userId: user.id, skillId: skillMap.get('React') }
        ]);

        const [company] = await db.insert(companies).values({
            name: 'Tech Corp',
            userId: user.id
        }).returning();

        console.log('Seeding jobs...');
        const [job1] = await db.insert(jobs).values({
            title: 'Frontend Dev',
            description: 'React dev needed',
            companyId: company.id,
            isActive: true,
            viewsCount: 0,
            applicationCount: 0
        }).returning();
        await db.insert(jobSkills).values({ jobId: job1.id, skillId: skillMap.get('React'), isRequired: true });

        const [job2] = await db.insert(jobs).values({
            title: 'Backend Dev',
            description: 'Python dev needed',
            companyId: company.id,
            isActive: true
        }).returning();
        await db.insert(jobSkills).values([
            { jobId: job2.id, skillId: skillMap.get('Python'), isRequired: true },
            { jobId: job2.id, skillId: skillMap.get('AWS'), isRequired: true }
        ]);

        const [job3] = await db.insert(jobs).values({
            title: 'Fullstack Dev',
            description: 'Fullstack needed',
            companyId: company.id,
            isActive: true
        }).returning();
        await db.insert(jobSkills).values([
            { jobId: job3.id, skillId: skillMap.get('Node.js'), isRequired: true },
            { jobId: job3.id, skillId: skillMap.get('React'), isRequired: true },
            { jobId: job3.id, skillId: skillMap.get('SQL'), isRequired: true }
        ]);

        console.log('\nTesting Job Matching...');
        const matches = await matchJobsForUser(user.id);
        matches.forEach(m => console.log(`Job: ${m.title}, Match: ${m.match_percentage}%`));

        const job1Match = matches.find(m => m.id === job1.id);
        if (job1Match && Math.round(job1Match.match_percentage as number) === 100) {
            console.log('SUCCESS: Job Matching logic works (100% match found).');
        } else {
            console.log('FAILURE: Job Matching logic incorrect.');
        }

        console.log('\nTesting Trigger (update_job_stats)...');

        await db.insert(applications).values({ userId: user.id, jobId: job1.id, status: 'applied' });

        const [job1Updated] = await db.select().from(jobs).where(eq(jobs.id, job1.id));
        console.log(`Updated App Count for Job 1: ${job1Updated.applicationCount}`);

        if (job1Updated.applicationCount === 1) {
            console.log('SUCCESS: Trigger updated application count.');
        } else {
            console.log('FAILURE: Trigger did not update application count.');
        }

        console.log('\nTesting Procedure (archive_expired_jobs)...');
        await db.update(jobs).set({ expiresAt: sql`NOW() - INTERVAL '1 day'`, isActive: true }).where(eq(jobs.id, job2.id));

        await db.execute(sql`SELECT archive_expired_jobs()`);

        const [job2Updated] = await db.select().from(jobs).where(eq(jobs.id, job2.id));
        console.log(`Job 2 Active Status: ${job2Updated.isActive}`);

        if (job2Updated.isActive === false) {
            console.log('SUCCESS: Procedure archived expired job.');
        } else {
            console.log('FAILURE: Procedure did not archive job.');
        }

        console.log('\n--- VERIFICATION COMPLETE ---');
        process.exit(0);

    } catch (err) {
        console.error('VERIFICATION FAILED:', err);
        process.exit(1);
    }
}

main();
