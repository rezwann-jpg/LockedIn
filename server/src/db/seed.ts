// src/db/seed.ts
import { seedUsers } from './scripts/seeds/users';
import { seedJobs } from './scripts/seeds/jobs';

async function seed() {
    console.log('🌱 Starting Consolidated Seeding...');

    try {
        await seedUsers();
        await seedJobs();

        console.log('✅ All data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
