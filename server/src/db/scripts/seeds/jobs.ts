// src/db/scripts/seeds/jobs.ts
import db from '../../../config/db';
import { jobs, companies, jobSkills, skills, categories } from '../../schema';
import { eq, sql } from 'drizzle-orm';

export async function seedJobs() {
    console.log('💼 Seeding jobs...');

    // 1. Clear existing job data for a clean reseed
    console.log('Clearing existing jobs, job_skills, and applications...');
    await db.execute(sql`TRUNCATE TABLE applications CASCADE`);
    await db.execute(sql`TRUNCATE TABLE job_skills CASCADE`);
    await db.execute(sql`TRUNCATE TABLE jobs CASCADE`);

    // 2. Get companies to associate jobs with
    const availableCompanies = await db.select().from(companies).limit(5);
    if (availableCompanies.length === 0) {
        throw new Error('No companies found. Seed users/companies first.');
    }

    // 3. Get categories
    const allCategories = await db.select().from(categories);
    const categoryMap = allCategories.reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
    }, {} as Record<string, number>);

    // 4. Job Data
    const jobData = [
        {
            title: 'Senior Frontend Engineer',
            description: 'Join our team to build next-gen interfaces using React and TypeScript.',
            location: 'Remote',
            companyId: availableCompanies[0].id,
            categoryId: categoryMap['Software Development'],
            jobType: 'full_time' as const,
            salaryMin: 120000,
            salaryMax: 160000,
            requirements: '5+ years experience with modern JS frameworks.',
            skills: ['React', 'TypeScript', 'Node.js']
        },
        {
            title: 'UI/UX Designer',
            description: 'Design elegant products for our global client base.',
            location: 'New York, NY',
            companyId: availableCompanies[1] ? availableCompanies[1].id : availableCompanies[0].id,
            categoryId: categoryMap['Design'],
            jobType: 'full_time' as const,
            salaryMin: 90000,
            salaryMax: 130000,
            requirements: 'Portfolio showcasing web and mobile designs.',
            skills: ['UI Design', 'Figma']
        }
    ];

    for (const j of jobData) {
        const { skills: jobSkillNames, ...jobDetails } = j;
        const [newJob] = await db.insert(jobs).values(jobDetails).returning();

        // Ensure skills exist and link them
        for (const skillName of jobSkillNames) {
            let [skill] = await db.select().from(skills).where(eq(skills.name, skillName)).limit(1);
            if (!skill) {
                [skill] = await db.insert(skills).values({ name: skillName }).returning();
            }

            await db.insert(jobSkills).values({
                jobId: newJob.id,
                skillId: skill.id,
                isRequired: true
            }).onConflictDoNothing();
        }
    }

    console.log('✅ Job seeding completed.');
}
