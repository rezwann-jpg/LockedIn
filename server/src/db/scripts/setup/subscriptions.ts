// src/db/scripts/setup/subscriptions.ts
import { sql } from 'drizzle-orm';
import db from '../../../config/db';

export async function setupSubscriptions() {
    console.log('Running subscription & notifications migration...');

    // 1. Create notification_type enum (idempotent)
    console.log('Creating notification_type enum...');
    await db.execute(sql`
        DO $$ BEGIN
            CREATE TYPE notification_type AS ENUM ('new_job');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
    `);

    // 2. Create company_subscriptions table
    console.log('Creating company_subscriptions table...');
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS company_subscriptions (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT company_subs_user_company_idx UNIQUE (user_id, company_id)
        );
    `);

    await db.execute(sql`
        CREATE INDEX IF NOT EXISTS company_subs_user_id_idx ON company_subscriptions (user_id);
    `);
    await db.execute(sql`
        CREATE INDEX IF NOT EXISTS company_subs_company_id_idx ON company_subscriptions (company_id);
    `);

    // 3. Create notifications table
    console.log('Creating notifications table...');
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS notifications (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type        notification_type NOT NULL DEFAULT 'new_job',
            title       VARCHAR(255) NOT NULL,
            message     TEXT NOT NULL,
            job_id      INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
            company_id  INTEGER REFERENCES companies(id) ON DELETE SET NULL,
            is_read     BOOLEAN NOT NULL DEFAULT FALSE,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    await db.execute(sql`
        CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);
    `);
    await db.execute(sql`
        CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications (is_read);
    `);
    await db.execute(sql`
        CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at);
    `);

    console.log('Subscription & notifications migration completed.');
}
