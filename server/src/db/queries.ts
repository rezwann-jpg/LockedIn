import { sql } from 'drizzle-orm';
import db from '../config/db';
import { jobs, companies, jobSkills, userSkills } from './schema';

export const matchJobsForUser = async (userId: number) => {
    try {
        const query = sql`
      WITH user_known_skills AS (
        SELECT skill_id 
        FROM ${userSkills}
        WHERE user_id = ${userId}
      ),
      job_scores AS (
        SELECT 
          j.id as job_id,
          COUNT(js.skill_id) FILTER (WHERE uks.skill_id IS NOT NULL) as matching_skills,
          COUNT(js.skill_id) as total_skills
        FROM ${jobs} j
        LEFT JOIN ${jobSkills} js ON j.id = js.job_id
        LEFT JOIN user_known_skills uks ON js.skill_id = uks.skill_id
        WHERE j.is_active = true
        GROUP BY j.id
      )
      SELECT 
        j.id,
        j.title,
        j.salary_min,
        j.salary_max,
        j.posted_at,
        c.name as company_name,
        c.logo_url as company_logo,
        js.matching_skills,
        js.total_skills,
        CASE 
          WHEN js.total_skills = 0 THEN 0 
          ELSE (js.matching_skills::float / js.total_skills) * 100 
        END as match_percentage
      FROM ${jobs} j
      JOIN ${companies} c ON j.company_id = c.id
      JOIN job_scores js ON j.id = js.job_id
      ORDER BY match_percentage DESC, j.posted_at DESC
      LIMIT 10;
    `;

        const result = await db.execute(query);
        return result.rows;
    } catch (error) {
        console.error('Error matching jobs:', error);
        throw error;
    }
};
