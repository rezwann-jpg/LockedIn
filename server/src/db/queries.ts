import { sql } from 'drizzle-orm';
import db from '../config/db';
import { jobs, companies, jobSkills, userSkills, applications } from './schema';

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
        j.description,
        j.location,
        j.job_type as "jobType",
        j.salary_min as "salaryMin",
        j.salary_max as "salaryMax",
        j.category_id as "categoryId",
        j.posted_at as "postedAt",
        c.name as "companyName",
        c.logo_url as "companyLogo",
        js.matching_skills as "matchingSkills",
        js.total_skills as "totalSkills",
        CASE 
          WHEN js.total_skills = 0 THEN 0 
          ELSE (js.matching_skills::float / js.total_skills) * 100 
        END as "matchPercentage",
        EXISTS (
          SELECT 1 FROM ${applications} a 
          WHERE a.job_id = j.id AND a.user_id = ${userId}
        ) as "hasApplied"
      FROM ${jobs} j
      JOIN ${companies} c ON j.company_id = c.id
      JOIN job_scores js ON j.id = js.job_id
      ORDER BY "matchPercentage" DESC, j.posted_at DESC
      LIMIT 10;
    `;

    const result = await db.execute(query);
    return result.rows;
  } catch (error) {
    console.error('Error matching jobs:', error);
    throw error;
  }
};

export const getJobsListing = async (options: {
  categoryId?: number;
  search?: string;
  sortBy?: 'recent' | 'match';
  userId?: number;
}) => {
  const { categoryId, search, sortBy, userId } = options;

  try {
    let query;

    if (sortBy === 'match' && userId) {
      // Use the match query logic (already exists in matchJobsForUser but we can inline or adapt)
      return matchJobsForUser(userId);
    }

    // Standard listing with optional filters
    const searchPattern = search ? `%${search}%` : null;

    query = sql`
      SELECT 
        j.id,
        j.title,
        j.description,
        j.location,
        j.job_type as "jobType",
        j.salary_min as "salaryMin",
        j.salary_max as "salaryMax",
        j.category_id as "categoryId",
        j.posted_at as "postedAt",
        c.name as "companyName",
        c.logo_url as "companyLogo",
        j.application_count as "applicationCount",
        ${userId ? sql`EXISTS (SELECT 1 FROM ${applications} a WHERE a.job_id = j.id AND a.user_id = ${userId})` : sql`false`} as "hasApplied"
      FROM ${jobs} j
      JOIN ${companies} c ON j.company_id = c.id
      WHERE j.is_active = true
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        ${categoryId ? sql`AND j.category_id = ${categoryId}` : sql``}
        ${searchPattern ? sql`AND (j.title ILIKE ${searchPattern} OR j.description ILIKE ${searchPattern} OR j.location ILIKE ${searchPattern})` : sql``}
      ORDER BY j.posted_at DESC
      LIMIT 50;
    `;

    const result = await db.execute(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching job listing:', error);
    throw error;
  }
};
