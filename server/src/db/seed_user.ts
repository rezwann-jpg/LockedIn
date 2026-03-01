
import db from '../config/db';
import { users } from './schema';
import bcrypt from 'bcrypt';

async function seedUser() {
    console.log('Seeding a test company user...');

    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await db.insert(users).values({
            email: 'company@example.com',
            name: 'Test Company User',
            role: 'company',
            passwordHash: hashedPassword
        }).onConflictDoNothing();

        console.log('Test company user seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed test user:', error);
        process.exit(1);
    }
}

seedUser();
