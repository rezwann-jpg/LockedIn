
import db from '../config/db';
import { jobs, companies, jobSkills, skills, categories, users } from './schema';
import { eq, sql } from 'drizzle-orm';

async function seed() {
    console.log('Starting Job Reseeding...');

    try {
        // 1. Clear existing job data
        console.log('Clearing existing jobs, job_skills, and applications...');
        await db.execute(sql`TRUNCATE TABLE applications CASCADE`);
        await db.execute(sql`TRUNCATE TABLE job_skills CASCADE`);
        await db.execute(sql`TRUNCATE TABLE jobs CASCADE`);

        // 2. Ensure we have companies to associate jobs with
        const existingCompanies = await db.select().from(companies).limit(5);
        let companiesToUse = existingCompanies;

        if (existingCompanies.length === 0) {
            console.log('No companies found. Seeding some test companies...');
            // Need a user for companies
            const [testUser] = await db.select().from(users).where(eq(users.role, 'company')).limit(1);
            if (!testUser) {
                console.error('No company user found to own test companies. Please sign up a company user first.');
                process.exit(1);
            }

            const newCompanies = await db.insert(companies).values([
                { name: 'TechFlow Systems', industry: 'Software', location: 'San Francisco, CA', userId: testUser.id, description: 'Cutting edge software solutions.' },
                { name: 'Creative Pulse', industry: 'Design', location: 'New York, NY', userId: testUser.id, description: 'Creative agency for modern brands.' },
                { name: 'Global Logistics', industry: 'Logistics', location: 'Chicago, IL', userId: testUser.id, description: 'Shipping things everywhere fast.' }
            ]).returning();
            companiesToUse = newCompanies;
        }

        // 3. Get categories
        const allCategories = await db.select().from(categories);
        if (allCategories.length === 0) {
            console.error('No categories found. Run db:setup first.');
            process.exit(1);
        }

        const categoryMap = allCategories.reduce((acc, cat) => {
            acc[cat.name] = cat.id;
            return acc;
        }, {} as Record<string, number>);

        // 4. Seed Jobs
        console.log('Seeding new jobs...');
        const jobData = [
            {
                title: 'Senior Frontend Engineer',
                description: 'We are looking for a React expert to help us build amazing user experiences.',
                location: 'San Francisco, CA',
                companyId: companiesToUse[0].id,
                categoryId: categoryMap['Software Development'],
                jobType: 'full_time' as const,
                salaryMin: 140000,
                salaryMax: 190000,
                remote: true,
                skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js']
            },
            {
                title: 'Product Designer',
                description: 'Join our design team to craft beautiful and intuitive interfaces.',
                location: 'New York, NY',
                companyId: companiesToUse[1] ? companiesToUse[1].id : companiesToUse[0].id,
                categoryId: categoryMap['Design'],
                jobType: 'full_time' as const,
                salaryMin: 110000,
                salaryMax: 160000,
                remote: false,
                skills: ['Figma', 'UI/UX', 'Prototyping']
            },
            {
                title: 'Backend Developer (Node.js)',
                description: 'Scale our infrastructure and build robust APIs.',
                location: 'Austin, TX',
                companyId: companiesToUse[0].id,
                categoryId: categoryMap['Software Development'],
                jobType: 'contract' as const,
                salaryMin: 90,
                salaryMax: 120, // Hourly rate for contrast
                remote: true,
                skills: ['Node.js', 'PostgreSQL', 'Docker', 'Drizzle ORM']
            },
            {
                title: 'Marketing Specialist',
                description: 'Drive growth through innovative digital campaigns.',
                location: 'Remote',
                companyId: companiesToUse[0].id,
                categoryId: categoryMap['Marketing'],
                jobType: 'part_time' as const,
                salaryMin: 40000,
                salaryMax: 60000,
                remote: true,
                skills: ['SEO', 'Content Strategy', 'Google Ads']
            },
            {
                title: 'Full Stack Intern',
                description: 'Learn from the best and build real-world applications.',
                location: 'San Francisco, CA',
                companyId: companiesToUse[0].id,
                categoryId: categoryMap['Software Development'],
                jobType: 'internship' as const,
                salaryMin: 4000,
                salaryMax: 6000, // Monthly
                remote: false,
                skills: ['JavaScript', 'HTML', 'CSS']
            }
        ];

        for (const j of jobData) {
            const { skills: jobSkillNames, ...jobDetails } = j;
            const [newJob] = await db.insert(jobs).values(jobDetails).returning();

            // Link skills
            for (const skillName of jobSkillNames) {
                // Get or create skill
                let [skill] = await db.select().from(skills).where(eq(skills.name, skillName)).limit(1);
                if (!skill) {
                    [skill] = await db.insert(skills).values({ name: skillName }).returning();
                }

                await db.insert(jobSkills).values({
                    jobId: newJob.id,
                    skillId: skill.id,
                    isRequired: true
                });
            }
        }

        console.log('Seeding Completed!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
