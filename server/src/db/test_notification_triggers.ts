// src/db/test_notification_triggers.ts
import { sql, eq } from 'drizzle-orm';
import db from '../config/db';
import { notifications, users, companies, jobs, applications, companySubscriptions } from './schema';

async function verify() {
    console.log('Verifying Notification Triggers...');

    try {
        // 1. Setup Test Data
        console.log('--- Setting up test data ---');

        // Clean up previous test data if exists (using specific naming to avoid accidental deletion)
        await db.execute(sql`DELETE FROM users WHERE email LIKE 'test_notifier_%'`);

        // Create test seeker
        const [seeker] = await db.insert(users).values({
            email: 'test_notifier_seeker@example.com',
            name: 'Test Seeker',
            passwordHash: 'dummy',
            role: 'job_seeker'
        }).returning();

        // Create test company user
        const [companyUser] = await db.insert(users).values({
            email: 'test_notifier_company@example.com',
            name: 'Test Company User',
            passwordHash: 'dummy',
            role: 'company'
        }).returning();

        // Create test company profile
        const [company] = await db.insert(companies).values({
            name: 'Test Trigger Corp',
            userId: companyUser.id,
            isVerified: true
        }).returning();

        // 2. Test Subscriber Notification (New Job)
        console.log('--- Testing New Job Notification for Subscribers ---');

        // Seeker subscribes to company
        await db.insert(companySubscriptions).values({
            userId: seeker.id,
            companyId: company.id
        });

        // Company posts a new job
        const [newJob] = await db.insert(jobs).values({
            title: 'Trigger Test Engineer',
            location: 'Remote',
            companyId: company.id,
            description: 'Testing DB triggers',
            jobType: 'full_time'
        }).returning();

        // Check if notification was created
        const seekerNotifications = await db.select()
            .from(notifications)
            .where(eq(notifications.userId, seeker.id));

        const jobNotification = seekerNotifications.find(n => n.type === 'new_job' && n.jobId === newJob.id);

        if (jobNotification) {
            console.log('✅ New Job Notification found for subscriber!');
            console.log('   Title:', jobNotification.title);
            console.log('   Message:', jobNotification.message);
        } else {
            console.error('❌ New Job Notification NOT found!');
        }

        // 3. Test Application Status Change Notification
        console.log('--- Testing Application Status Change Notification ---');

        // Seeker applies for the job
        const [app] = await db.insert(applications).values({
            userId: seeker.id,
            jobId: newJob.id,
            status: 'applied'
        }).returning();

        // Company updates application status
        await db.update(applications)
            .set({ status: 'interviewing' })
            .where(eq(applications.id, app.id));

        // Check if status update notification was created
        const updatedNotifications = await db.select()
            .from(notifications)
            .where(eq(notifications.userId, seeker.id));

        const statusNotification = updatedNotifications.find(n => n.type === 'application_status_update' && n.jobId === newJob.id);

        if (statusNotification) {
            console.log('✅ Status Update Notification found for applicant!');
            console.log('   Title:', statusNotification.title);
            console.log('   Message:', statusNotification.message);
        } else {
            console.error('❌ Status Update Notification NOT found!');
        }

        // Cleanup
        console.log('--- Cleaning up test data ---');
        await db.execute(sql`DELETE FROM users WHERE id IN (${seeker.id}, ${companyUser.id})`);

        console.log('Verification Completed.');
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verify();
