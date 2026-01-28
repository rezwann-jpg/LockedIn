import bcrypt from 'bcrypt';
import db from '../config/db';
import { users, companies, categories, skills, jobs, jobSkills, userSkills } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log('🌱 Starting seed...');

    try {
        // 1. Create a Company User
        const hashedJobSeekerPassword = await bcrypt.hash('password123', 10);
        const hashedCompanyPassword = await bcrypt.hash('company123', 10);

        console.log('Creating users...');
        const [companyUser] = await db.insert(users).values({
            email: 'hiring@techcorp.com',
            name: 'TechCorp Hiring',
            role: 'company',
            passwordHash: hashedCompanyPassword,
        }).onConflictDoNothing().returning();

        const [seekerUser] = await db.insert(users).values({
            email: 'dev@example.com',
            name: 'John Doe',
            role: 'job_seeker',
            passwordHash: hashedJobSeekerPassword,
        }).onConflictDoNothing().returning();

        // 2. Create Companies
        console.log('Creating companies...');
        const [techCorp] = await db.insert(companies).values({
            name: 'TechCorp Solutions',
            description: 'A leading technology solutions provider specializing in AI and Cloud.',
            website: 'https://techcorp.com',
            logoUrl: 'https://logo.clearbit.com/google.com',
            industry: 'Technology',
            location: 'San Francisco, CA',
            userId: companyUser.id,
        }).onConflictDoNothing().returning();

        const [creativeAgency] = await db.insert(companies).values({
            name: 'Creative Agency',
            description: 'Design and branding experts for the modern age.',
            website: 'https://creativeagency.com',
            logoUrl: 'https://logo.clearbit.com/apple.com',
            industry: 'Design',
            location: 'New York, NY',
            userId: companyUser.id,
        }).onConflictDoNothing().returning();

        // 3. Create Categories
        console.log('Creating categories...');
        const [softwareDev] = await db.insert(categories).values({
            name: 'Software Development',
            description: 'Building the future with code.',
        }).onConflictDoNothing().returning();

        const [designCat] = await db.insert(categories).values({
            name: 'Design',
            description: 'Crafting beautiful user experiences.',
        }).onConflictDoNothing().returning();

        // 4. Create Skills
        console.log('Creating skills...');
        const skillList = [
            'React', 'Node.js', 'PostgreSQL', 'TypeScript', 'UI Design', 'Figma', 'Python', 'Docker'
        ];

        const savedSkills = [];
        for (const name of skillList) {
            const [skill] = await db.insert(skills).values({ name }).onConflictDoUpdate({ target: skills.name, set: { name } }).returning();
            savedSkills.push(skill);
        }

        // 5. Assign some skills to the seeker
        console.log('Assigning skills to seeker...');
        const seekerSkills = savedSkills.filter(s => ['React', 'TypeScript', 'Node.js'].includes(s.name));
        for (const s of seekerSkills) {
            await db.insert(userSkills).values({
                userId: seekerUser.id,
                skillId: s.id
            }).onConflictDoNothing();
        }

        // 6. Create Jobs
        console.log('Creating jobs...');
        const jobData = [
            {
                title: 'Senior Frontend Engineer',
                description: 'Join our team to build next-gen interfaces using React and TypeScript.',
                location: 'Remote',
                companyId: techCorp.id,
                categoryId: softwareDev.id,
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
                companyId: creativeAgency.id,
                categoryId: designCat.id,
                jobType: 'full_time' as const,
                salaryMin: 90000,
                salaryMax: 130000,
                requirements: 'Portfolio showcasing web and mobile designs.',
                skills: ['UI Design', 'Figma']
            },
            {
                title: 'Backend Developer (Node.js)',
                description: 'Scale our cloud infrastructure and improve API performance.',
                location: 'San Francisco, CA',
                companyId: techCorp.id,
                categoryId: softwareDev.id,
                jobType: 'contract' as const,
                salaryMin: 100000,
                salaryMax: 140000,
                requirements: 'Strong Node.js and SQL skills.',
                skills: ['Node.js', 'PostgreSQL', 'Docker']
            }
        ];

        for (const data of jobData) {
            const { skills: jobSkillNames, ...jobDetails } = data;
            const [job] = await db.insert(jobs).values(jobDetails).returning();

            const relatedSkills = savedSkills.filter(s => jobSkillNames.includes(s.name));
            for (const s of relatedSkills) {
                await db.insert(jobSkills).values({
                    jobId: job.id,
                    skillId: s.id,
                }).onConflictDoNothing();
            }
        }

        console.log('✅ Seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
