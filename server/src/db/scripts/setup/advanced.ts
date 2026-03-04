// src/db/scripts/setup/advanced.ts
import { sql } from 'drizzle-orm';
import db from '../../../config/db';

export async function setupAdvanced() {
    console.log('Pushing Advanced Database Logic...');

    // 1. Transactional Procedure for Submitting Applications
    console.log('Creating procedure: submit_job_application...');
    await db.execute(sql`
      CREATE OR REPLACE PROCEDURE submit_job_application(
        p_user_id INT,
        p_job_id INT,
        p_resume_id INT,
        p_cover_letter TEXT
      )
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_is_active BOOLEAN;
        v_expires_at TIMESTAMP;
      BEGIN
        -- 1. Check job validity
        SELECT is_active, expires_at INTO v_is_active, v_expires_at 
        FROM jobs WHERE id = p_job_id;
        
        IF NOT v_is_active OR (v_expires_at IS NOT NULL AND v_expires_at < NOW()) THEN
          RAISE EXCEPTION 'Job is no longer active or has expired';
        END IF;

        -- 2. Check for duplicate application
        IF EXISTS (SELECT 1 FROM applications WHERE user_id = p_user_id AND job_id = p_job_id) THEN
          RAISE EXCEPTION 'User has already applied for this job';
        END IF;

        -- 3. Insert application
        INSERT INTO applications (user_id, job_id, cover_letter, status)
        VALUES (p_user_id, p_job_id, p_cover_letter, 'applied');

        -- Note: Trigger 'update_job_stats' handles the count increment
      END;
      $$;
    `);

    // 2. Trigger Function for Status Auditing
    console.log('Creating trigger function: log_status_change...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION log_status_change()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
          INSERT INTO application_history (application_id, old_status, new_status, changed_by)
          VALUES (NEW.id, OLD.status, NEW.status, NULL);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('Creating trigger: trg_log_app_status...');
    await db.execute(sql`
      DROP TRIGGER IF EXISTS trg_log_app_status ON applications;
      CREATE TRIGGER trg_log_app_status
      AFTER UPDATE ON applications
      FOR EACH ROW
      EXECUTE FUNCTION log_status_change();
    `);

    // 3. Full-Text Search Vector Update Trigger
    console.log('Creating function: update_search_vector...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector = to_tsvector('english', 
          coalesce(NEW.version_name, '') || ' ' || 
          coalesce(NEW.search_text, '') || ' ' || 
          coalesce(NEW.parsed_content::text, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('Creating trigger: trg_update_resume_vector...');
    await db.execute(sql`
      DROP TRIGGER IF EXISTS trg_update_resume_vector ON user_resumes;
      CREATE TRIGGER trg_update_resume_vector
      BEFORE INSERT OR UPDATE ON user_resumes
      FOR EACH ROW
      EXECUTE FUNCTION update_search_vector();
    `);

    // 4. Analytical Query View: Category Demand
    console.log('Creating view: category_demand_analytics...');
    await db.execute(sql`
      CREATE OR REPLACE VIEW category_demand_analytics AS
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT a.id) as total_applications,
        ROUND(COUNT(DISTINCT a.id)::numeric / GREATEST(COUNT(DISTINCT j.id), 1), 2) as applications_per_job
      FROM categories c
      LEFT JOIN jobs j ON c.id = j.category_id
      LEFT JOIN applications a ON j.id = a.job_id
      GROUP BY c.id, c.name
      ORDER BY applications_per_job DESC;
    `);

    console.log('Advanced Database Logic setup completed.');
}
