// src/db/scripts/seeds/users.ts
import bcrypt from 'bcrypt';
import db from '../../../config/db';
import { users, companies } from '../../schema';

export async function seedUsers() {
    console.log('👥 Seeding users and companies...');

    const hashedJobSeekerPassword = await bcrypt.hash('password123', 10);
    const hashedCompanyPassword = await bcrypt.hash('company123', 10);

    // 1. Create a Company User
    const [companyUser] = await db.insert(users).values({
        email: 'hiring@techcorp.com',
        name: 'TechCorp Hiring',
        role: 'company',
        passwordHash: hashedCompanyPassword,
    }).onConflictDoUpdate({ target: users.email, set: { name: 'TechCorp Hiring' } }).returning();

    // 2. Create a Job Seeker
    const [seekerUser] = await db.insert(users).values({
        email: 'dev@example.com',
        name: 'John Doe',
        role: 'job_seeker',
        passwordHash: hashedJobSeekerPassword,
    }).onConflictDoUpdate({ target: users.email, set: { name: 'John Doe' } }).returning();

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
            userId: companyUser.id,
        },
        {
            name: 'Creative Agency',
            description: 'Design and branding experts for the modern age.',
            website: 'https://creativeagency.com',
            logoUrl: 'https://logo.clearbit.com/apple.com',
            industry: 'Design',
            location: 'New York, NY',
            userId: companyUser.id,
        }
    ]).onConflictDoNothing();

    console.log('✅ User and Company seeding completed.');
}
