// src/db/scripts/seeds/users.ts
import bcrypt from 'bcrypt';
import db from '../../../config/db';
import { users, companies } from '../../schema';

export async function seedUsers() {
    console.log('👥 Seeding users and companies...');

    const hashedJobSeekerPassword = await bcrypt.hash('password123', 10);
    const hashedCompanyPassword = await bcrypt.hash('company123', 10);

    // 1. Create Company Users
    const companyUsersData = [
        { email: 'hiring@techcorp.com', name: 'TechCorp Hiring' },
        { email: 'hr@globaledu.com', name: 'Global Edu HR' },
        { email: 'talent@healthplus.org', name: 'HealthPlus Talent' },
        { email: 'recruitment@salespro.com', name: 'SalesPro Recruitment' }
    ];

    const companyUsers = [];
    for (const data of companyUsersData) {
        const [user] = await db.insert(users).values({
            email: data.email,
            name: data.name,
            role: 'company',
            passwordHash: hashedCompanyPassword,
        }).onConflictDoUpdate({ target: users.email, set: { name: data.name } }).returning();
        companyUsers.push(user);
    }

    // 2. Create Job Seekers
    const seekersData = [
        { email: 'dev@example.com', name: 'John Doe' },
        { email: 'jane@example.com', name: 'Jane Smith' },
        { email: 'alice@example.com', name: 'Alice Johnson' },
        { email: 'bob@example.com', name: 'Bob Wilson' },
        { email: 'charlie@example.com', name: 'Charlie Brown' }
    ];

    for (const data of seekersData) {
        await db.insert(users).values({
            email: data.email,
            name: data.name,
            role: 'job_seeker',
            passwordHash: hashedJobSeekerPassword,
        }).onConflictDoUpdate({ target: users.email, set: { name: data.name } }).returning();
    }

    // 3. Create Companies
    console.log('🏢 Creating companies...');
    await db.insert(companies).values([
        {
            name: 'TechCorp Solutions',
            description: 'A leading technology solutions provider specializing in AI and Cloud.',
            website: 'https://techcorp.com',
            logoUrl: 'https://logo.clearbit.com/google.com',
            industry: 'Technology',
            location: 'San Francisco, CA',
            userId: companyUsers[0].id,
        },
        {
            name: 'Global Education Group',
            description: 'Revolutionizing learning through digital platforms.',
            website: 'https://globaledu.com',
            logoUrl: 'https://logo.clearbit.com/coursera.org',
            industry: 'Education',
            location: 'London, UK',
            userId: companyUsers[1].id,
        },
        {
            name: 'HealthPlus Systems',
            description: 'Patient-first healthcare management solutions.',
            website: 'https://healthplus.org',
            logoUrl: 'https://logo.clearbit.com/mayoclinic.org',
            industry: 'Healthcare',
            location: 'Boston, MA',
            userId: companyUsers[2].id,
        },
        {
            name: 'SalesPro Worldwide',
            description: 'High-performance sales and marketing agency.',
            website: 'https://salespro.com',
            logoUrl: 'https://logo.clearbit.com/salesforce.com',
            industry: 'Sales',
            location: 'New York, NY',
            userId: companyUsers[3].id,
        }
    ]).onConflictDoNothing();

    console.log('✅ User and Company seeding completed.');
}
