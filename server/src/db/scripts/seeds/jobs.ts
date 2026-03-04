// src/db/scripts/seeds/jobs.ts
import db from '../../../config/db';
import { jobs, companies, jobSkills, skills, categories } from '../../schema';
import { eq, sql } from 'drizzle-orm';

export async function seedJobs() {
    console.log('💼 Seeding jobs...');

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
            title: 'AI Researcher',
            description: 'Push the boundaries of what is possible with Large Language Models.',
            location: 'San Francisco, CA',
            companyId: availableCompanies[0].id,
            categoryId: categoryMap['AI & Machine Learning'],
            jobType: 'full_time' as const,
            salaryMin: 150000,
            salaryMax: 220000,
            requirements: 'PhD in CS or related field, background in PyTorch.',
            skills: ['Python', 'PyTorch', 'Machine Learning']
        },
        {
            title: 'High School Mathematics Teacher',
            description: 'Inspire the next generation of engineers and scientists.',
            location: 'London, UK',
            companyId: availableCompanies[1] ? availableCompanies[1].id : availableCompanies[0].id,
            categoryId: categoryMap['Teaching'],
            jobType: 'full_time' as const,
            salaryMin: 45000,
            salaryMax: 65000,
            requirements: 'QTS qualification and 2+ years experience.',
            skills: ['Mathematics', 'Pedagogy', 'Classroom Management']
        },
        {
            title: 'Senior Nurse (ER)',
            description: 'Provide critical care in a fast-paced environment.',
            location: 'Boston, MA',
            companyId: availableCompanies[2] ? availableCompanies[2].id : availableCompanies[0].id,
            categoryId: categoryMap['Nursing'],
            jobType: 'full_time' as const,
            salaryMin: 85000,
            salaryMax: 110000,
            requirements: 'RN certification and 5+ years in Emergency Medicine.',
            skills: ['Emergency Medicine', 'Patient Care', 'ACLS']
        },
        {
            title: 'Enterprise Account Executive',
            description: 'Drive growth by managing complex sales cycles with Fortune 500 companies.',
            location: 'New York, NY',
            companyId: availableCompanies[3] ? availableCompanies[3].id : availableCompanies[0].id,
            categoryId: categoryMap['Sales'],
            jobType: 'full_time' as const,
            salaryMin: 100000,
            salaryMax: 150000,
            requirements: 'Proven track record in B2B SaaS sales.',
            skills: ['B2B Sales', 'Negotiation', 'CRM']
        },
        {
            title: 'DevOps Engineer',
            description: 'Scale our multi-cloud infrastructure.',
            location: 'Remote',
            companyId: availableCompanies[0].id,
            categoryId: categoryMap['DevOps'],
            jobType: 'contract' as const,
            salaryMin: 90,
            salaryMax: 130,
            requirements: 'Expertise in Kubernetes and Terraform.',
            skills: ['Kubernetes', 'AWS', 'Terraform']
        }
    ];

    for (const j of jobData) {
        const { skills: jobSkillNames, ...jobDetails } = j;
        const [newJob] = await db.insert(jobs).values(jobDetails).onConflictDoNothing().returning();

        if (!newJob) continue; // Skip if job already exists

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
