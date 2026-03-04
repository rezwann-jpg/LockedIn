import { sql } from 'drizzle-orm';
import db from '../config/db';
import { jobs, companies, jobSkills, userSkills, applications } from './schema';

export const getJobsListing = async (options: {
  categoryId?: number;
  search?: string;
  sortBy?: 'recent' | 'match';
  userId?: number;
  jobType?: string;
  location?: string;
  salaryMin?: number;
  remote?: boolean;
  limit?: number;
  offset?: number;
}) => {
  const {
    categoryId,
    search,
    sortBy = 'recent',
    userId,
    jobType,
    location,
    salaryMin,
    remote,
    limit = 20,
    offset = 0
  } = options;

  try {
    const searchPattern = search ? `%${search}%` : null;
    const locationPattern = location ? `%${location}%` : null;

    const query = sql`
      WITH user_known_skills AS (
        SELECT skill_id 
        FROM ${userSkills}
        WHERE user_id = ${userId || -1}
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
        j.requirements,
        j.responsibilities,
        j.location,
        j.job_type as "jobType",
        j.salary_min as "salaryMin",
        j.salary_max as "salaryMax",
        j.category_id as "categoryId",
        j.posted_at as "postedAt",
        j.remote,
        c.id as "companyId",
        c.name as "companyName",
        c.logo_url as "companyLogo",
        j.application_count as "applicationCount",
        js.matching_skills as "matchingSkills",
        js.total_skills as "totalSkills",
        CASE 
          WHEN js.total_skills = 0 THEN 0 
          ELSE (js.matching_skills::float / js.total_skills) * 100 
        END as "matchPercentage",
        ${userId ? sql`EXISTS (SELECT 1 FROM ${applications} a WHERE a.job_id = j.id AND a.user_id = ${userId})` : sql`false`} as "hasApplied"
      FROM ${jobs} j
      JOIN ${companies} c ON j.company_id = c.id
      JOIN job_scores js ON j.id = js.job_id
      WHERE j.is_active = true
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        ${categoryId ? sql`AND j.category_id = ${categoryId}` : sql``}
        ${jobType ? sql`AND j.job_type = ${jobType}` : sql``}
        ${remote !== undefined ? sql`AND j.remote = ${remote}` : sql``}
        ${salaryMin ? sql`AND (j.salary_min >= ${salaryMin} OR j.salary_max >= ${salaryMin})` : sql``}
        ${locationPattern ? sql`AND j.location ILIKE ${locationPattern}` : sql``}
        ${searchPattern ? sql`AND (j.title ILIKE ${searchPattern} OR j.description ILIKE ${searchPattern} OR c.name ILIKE ${searchPattern})` : sql``}
      ORDER BY 
        ${sortBy === 'match' ? sql`"matchPercentage" DESC, ` : sql``}
        j.posted_at DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const result = await db.execute(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching job listing:', error);
    throw error;
  }
};
