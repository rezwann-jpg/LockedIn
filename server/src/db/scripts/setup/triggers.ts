// src/db/scripts/setup/triggers.ts
import { sql } from 'drizzle-orm';
import db from '../../../config/db';

export async function setupTriggers() {
    console.log('Pushing Notification Trigger Logic...');

    // 1. Update notification_type enum in Postgres
    console.log('Updating notification_type enum...');
    await db.execute(sql`
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'application_status_update';
    `);

    // 2. Trigger Function: notify_company_subscribers
    console.log('Creating trigger function: fn_notify_company_subscribers...');
    await db.execute(sql`
        CREATE OR REPLACE FUNCTION fn_notify_company_subscribers()
        RETURNS TRIGGER AS $$
        DECLARE
            v_company_name TEXT;
            v_subscriber_id INT;
        BEGIN
            -- Get common company name
            SELECT name INTO v_company_name FROM companies WHERE id = NEW.company_id;

            -- Insert notification for each subscriber
            FOR v_subscriber_id IN 
                SELECT user_id FROM company_subscriptions WHERE company_id = NEW.company_id
            LOOP
                INSERT INTO notifications (user_id, type, title, message, job_id, company_id)
                VALUES (
                    v_subscriber_id, 
                    'new_job', 
                    'New job at ' || v_company_name, 
                    NEW.title || ' — ' || NEW.location,
                    NEW.id,
                    NEW.company_id
                );
            END LOOP;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // 3. Trigger: trg_notify_new_job
    console.log('Creating trigger: trg_notify_new_job...');
    await db.execute(sql`
        DROP TRIGGER IF EXISTS trg_notify_new_job ON jobs;
        CREATE TRIGGER trg_notify_new_job
        AFTER INSERT ON jobs
        FOR EACH ROW
        EXECUTE FUNCTION fn_notify_company_subscribers();
    `);

    // 4. Trigger Function: notify_application_status_change
    console.log('Creating trigger function: fn_notify_application_status_change...');
    await db.execute(sql`
        CREATE OR REPLACE FUNCTION fn_notify_application_status_change()
        RETURNS TRIGGER AS $$
        DECLARE
            v_job_title TEXT;
            v_company_name TEXT;
        BEGIN
            -- Only notify if status actually changed
            IF (OLD.status IS DISTINCT FROM NEW.status) THEN
                -- Get job details
                SELECT j.title, c.name INTO v_job_title, v_company_name
                FROM jobs j
                JOIN companies c ON j.company_id = c.id
                WHERE j.id = NEW.job_id;

                INSERT INTO notifications (user_id, type, title, message, job_id, company_id)
                VALUES (
                    NEW.user_id,
                    'application_status_update',
                    'Application Status Updated',
                    'Your application for "' || v_job_title || '" at ' || v_company_name || ' is now: ' || NEW.status,
                    NEW.job_id,
                    (SELECT company_id FROM jobs WHERE id = NEW.job_id)
                );
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // 5. Trigger: trg_notify_app_status
    console.log('Creating trigger: trg_notify_app_status...');
    await db.execute(sql`
        DROP TRIGGER IF EXISTS trg_notify_app_status ON applications;
        CREATE TRIGGER trg_notify_app_status
        AFTER UPDATE ON applications
        FOR EACH ROW
        EXECUTE FUNCTION fn_notify_application_status_change();
    `);

    console.log('Notification Trigger Logic setup completed.');
}
