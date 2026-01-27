import { sql } from 'drizzle-orm';
import db from '../config/db';

async function main() {
  console.log('Running DB Extensions Setup...');

  try {
    // 1. Stored Procedure: archive_expired_jobs
    console.log('Creating stored procedure: archive_expired_jobs...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION archive_expired_jobs()
      RETURNS void AS $$
      BEGIN
        UPDATE jobs
        SET is_active = false
        WHERE expires_at < NOW() AND is_active = true;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. Trigger Function: update_job_application_count
    console.log('Creating trigger function: update_job_application_count...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_job_application_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          UPDATE jobs SET application_count = application_count + 1 WHERE id = NEW.job_id;
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          UPDATE jobs SET application_count = application_count - 1 WHERE id = OLD.job_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. Trigger: update_job_stats
    console.log('Creating trigger: update_job_stats...');
    await db.execute(sql`
      DROP TRIGGER IF EXISTS update_job_stats ON applications;
      CREATE TRIGGER update_job_stats
      AFTER INSERT OR DELETE ON applications
      FOR EACH ROW
      EXECUTE FUNCTION update_job_application_count();
    `);

    // 4. Function: update_updated_at_column
    console.log('Creating function: update_updated_at_column...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. Triggers: set_timestamp (for users, companies, jobs, applications)
    const tables = ['users', 'companies', 'jobs', 'applications'];
    for (const table of tables) {
      console.log(`Creating updated_at trigger for table: ${table}...`);
      await db.execute(sql.raw(`
        DROP TRIGGER IF EXISTS set_timestamp ON ${table};
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `));
    }

    // 6. Stored Procedure: reactivate_expired_job
    console.log('Creating stored procedure: reactivate_expired_job...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION reactivate_expired_job(p_job_id INT, p_days_active INT)
      RETURNS void AS $$
      BEGIN
        UPDATE jobs
        SET is_active = true,
            expires_at = NOW() + (p_days_active || ' days')::INTERVAL,
            updated_at = NOW()
        WHERE id = p_job_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('DB Extensions Setup Completed Successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up DB extensions:', err);
    process.exit(1);
  }
}

main();
