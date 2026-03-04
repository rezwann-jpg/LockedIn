// src/db/scripts/seeds/applications.ts
import db from '../../../config/db';
import { users, jobs, applications } from '../../schema';
import { eq, and } from 'drizzle-orm';

export async function seedApplications() {
    console.log('📝 Simulating job applications...');

    // 1. Get all job seekers
    const seekers = await db.select().from(users).where(eq(users.role, 'job_seeker'));
    if (seekers.length === 0) {
        console.log('No seekers found. Skipping application simulation.');
        return;
    }

    // 2. Get all jobs
    const allJobs = await db.select().from(jobs);
    if (allJobs.length === 0) {
        console.log('No jobs found. Skipping application simulation.');
        return;
    }

    const statuses = ['applied', 'reviewed', 'interviewing', 'offered', 'hired', 'rejected'] as const;

    // 3. Create random applications
    for (const seeker of seekers) {
        // Randomly pick 2-4 jobs for each seeker to apply to
        const numApplications = Math.floor(Math.random() * 3) + 2;
        const shuffledJobs = [...allJobs].sort(() => 0.5 - Math.random());
        const selectedJobs = shuffledJobs.slice(0, numApplications);

        for (const job of selectedJobs) {
            // Pick a random status
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            await db.insert(applications).values({
                userId: seeker.id,
                jobId: job.id,
                coverLetter: `I am very interested in the ${job.title} position at this company. I have the required skills and experience.`,
                status: status,
            }).onConflictDoNothing();
        }
    }

    console.log('✅ Application simulation completed.');
}
