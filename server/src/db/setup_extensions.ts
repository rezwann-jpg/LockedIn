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

    // 7. Function: get_or_create_skill_id
    console.log('Creating function: get_or_create_skill_id...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_or_create_skill_id(p_name TEXT)
      RETURNS INT AS $$
      DECLARE
        v_skill_id INT;
      BEGIN
        SELECT id INTO v_skill_id FROM skills WHERE LOWER(name) = LOWER(TRIM(p_name));
        IF v_skill_id IS NULL THEN
          INSERT INTO skills (name) VALUES (TRIM(p_name)) RETURNING id INTO v_skill_id;
        END IF;
        RETURN v_skill_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 8. Function: has_user_graduated
    console.log('Creating function: has_user_graduated...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION has_user_graduated(p_user_id INT)
      RETURNS BOOLEAN AS $$
      DECLARE
        v_has_future_edu BOOLEAN;
      BEGIN
        SELECT EXISTS (
          SELECT 1 FROM educations 
          WHERE user_id = p_user_id 
          AND (end_date IS NULL OR end_date > NOW())
        ) INTO v_has_future_edu;
        RETURN NOT v_has_future_edu;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 9. Stored Procedure: add_user_skill_by_name
    console.log('Creating stored procedure: add_user_skill_by_name...');
    await db.execute(sql`
      CREATE OR REPLACE PROCEDURE add_user_skill_by_name(p_user_id INT, p_skill_name TEXT)
      AS $$
      DECLARE
        v_skill_id INT;
      BEGIN
        v_skill_id := get_or_create_skill_id(p_skill_name);
        INSERT INTO user_skills (user_id, skill_id) 
        VALUES (p_user_id, v_skill_id)
        ON CONFLICT DO NOTHING;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 10. Stored Procedure: update_user_skills
    console.log('Creating stored procedure: update_user_skills...');
    await db.execute(sql`
      CREATE OR REPLACE PROCEDURE update_user_skills(p_user_id INT, p_skill_names TEXT[])
      AS $$
      DECLARE
        skill_name TEXT;
        v_skill_id INT;
      BEGIN
        DELETE FROM user_skills WHERE user_id = p_user_id;
        FOREACH skill_name IN ARRAY p_skill_names LOOP
          IF skill_name IS NOT NULL AND TRIM(skill_name) <> '' THEN
            v_skill_id := get_or_create_skill_id(skill_name);
            INSERT INTO user_skills (user_id, skill_id) 
            VALUES (p_user_id, v_skill_id)
            ON CONFLICT DO NOTHING;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 11. Stored Procedure: update_job_skills
    console.log('Creating stored procedure: update_job_skills...');
    await db.execute(sql`
      CREATE OR REPLACE PROCEDURE update_job_skills(p_job_id INT, p_skill_names TEXT[])
      AS $$
      DECLARE
        skill_name TEXT;
        v_skill_id INT;
      BEGIN
        DELETE FROM job_skills WHERE job_id = p_job_id;
        FOREACH skill_name IN ARRAY p_skill_names LOOP
          IF skill_name IS NOT NULL AND TRIM(skill_name) <> '' THEN
            v_skill_id := get_or_create_skill_id(skill_name);
            INSERT INTO job_skills (job_id, skill_id) 
            VALUES (p_job_id, v_skill_id)
            ON CONFLICT DO NOTHING;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 12. Seed Default Categories
    console.log('Seeding default categories...');
    const defaultCategories = [
      'Software Development',
      'Design',
      'Marketing',
      'Product Management',
      'Sales',
      'Data Science',
      'Customer Support',
      'Operations',
      'Human Resources',
      'Finance'
    ];

    for (const catName of defaultCategories) {
      await db.execute(sql`
        INSERT INTO categories (name) 
        VALUES (${catName}) 
        ON CONFLICT (name) DO NOTHING;
      `);
    }

    console.log('DB Extensions Setup Completed Successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up DB extensions:', err);
    process.exit(1);
  }
}

main();
