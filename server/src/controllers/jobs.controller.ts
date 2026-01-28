import { Request, Response } from 'express';
import { eq, desc, and, gt, isNull, or } from 'drizzle-orm'; // Added missing operators
import db from '../config/db';
import { jobs, companies, skills, jobSkills, applications } from '../db/schema';
import { UserRole } from '../db/schema';
import { sql } from 'drizzle-orm';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: UserRole;
    };
}

// Helper: Get company ID for authenticated company user
const getCompanyIdForUser = async (userId: number): Promise<number | null> => {
    const [company] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.userId, userId))
        .limit(1);
    return company?.id ?? null;
};

// 1. POST /jobs - Create job (Company only)
export const createJob = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'company') {
            return res.status(403).json({ error: 'Only companies can post jobs' });
        }

        // CRITICAL: Validate required fields (middleware may exist, but validate here too)
        const requiredFields = ['title', 'description', 'location', 'jobType'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        // Get company ID - FAIL if profile doesn't exist
        const companyId = await getCompanyIdForUser(user.id);
        if (!companyId) {
            return res.status(400).json({
                error: 'Company profile not found. Please complete your company profile setup first.'
            });
        }

        // Validate salary range if provided
        if (req.body.salaryMin && req.body.salaryMax && req.body.salaryMin > req.body.salaryMax) {
            return res.status(400).json({ error: 'salaryMin cannot be greater than salaryMax' });
        }

        // Create job with proper expiration (UTC-safe)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

        const [newJob] = await db.insert(jobs).values({
            title: req.body.title,
            description: req.body.description,
            requirements: req.body.requirements,
            responsibilities: req.body.responsibilities,
            location: req.body.location,
            salaryMin: req.body.salaryMin,
            salaryMax: req.body.salaryMax,
            salaryCurrency: req.body.salaryCurrency || 'USD',
            jobType: req.body.jobType,
            experienceLevel: req.body.experienceLevel || 'mid',
            categoryId: req.body.categoryId,
            companyId,
            remote: !!req.body.remote,
            isActive: true,
            expiresAt,
        }).returning();

        // Handle skills insertion via stored procedure
        if (req.body.skills && Array.isArray(req.body.skills)) {
            const skillNames = req.body.skills.filter((s: any) => typeof s === 'string');
            if (skillNames.length > 0) {
                const skillArraySql = sql`ARRAY[${sql.join(skillNames.map((s: string) => sql`${s}`), sql`, `)}]::TEXT[]`;
                await db.execute(sql`CALL update_job_skills(${newJob.id}::INT, ${skillArraySql})`);
            }
        }

        res.status(201).json({ job: newJob });
    } catch (err) {
        console.error('Error creating job:', err);
        res.status(500).json({ error: 'Failed to create job' });
    }
};

import { matchJobsForUser, getJobsListing } from '../db/queries';

// 2. GET /jobs - Public job board (active + non-expired only)
export const getJobs = async (req: Request, res: Response) => {
    try {
        const { sort, categoryId, search } = req.query;
        const user = (req as any).user;

        const jobsListing = await getJobsListing({
            categoryId: categoryId ? parseInt(categoryId as string) : undefined,
            search: search as string,
            sortBy: sort as any,
            userId: user?.id
        });

        res.json({ jobs: jobsListing });
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

// 3. GET /company/jobs - Company's own jobs (all statuses)
export const getCompanyJobs = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'company') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = await getCompanyIdForUser(user.id);
        if (!companyId) {
            return res.status(400).json({
                error: 'Company profile not found. Please complete your company profile setup first.'
            });
        }

        const companyJobs = await db
            .select()
            .from(jobs)
            .where(eq(jobs.companyId, companyId))
            .orderBy(desc(jobs.postedAt));

        res.json({ jobs: companyJobs });
    } catch (err) {
        console.error('Error fetching company jobs:', err);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

// 4. GET /jobs/matched - Recommended jobs for user
export const getMatchedJobs = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'job_seeker') {
            return res.status(403).json({ error: 'Only job seekers can get matched jobs' });
        }

        const matchedJobs = await matchJobsForUser(user.id);
        res.json({ jobs: matchedJobs });
    } catch (err) {
        console.error('Error fetching matched jobs:', err);
        res.status(500).json({ error: 'Failed to fetch matched jobs' });
    }
};

// 5. POST /jobs/:id/apply - Apply for a job
export const applyToJob = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const jobId = parseInt(req.params.id as string);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (isNaN(jobId)) {
            return res.status(400).json({ error: 'Invalid job ID' });
        }

        // Check if already applied
        const [existing] = await db
            .select()
            .from(applications)
            .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)));

        if (existing) {
            return res.status(400).json({ error: 'Already applied for this job' });
        }

        // Check graduation status via DB function
        const graduationQuery = sql`SELECT has_user_graduated(${userId}::INT) as graduated`;
        const gradRows = (await db.execute(graduationQuery)).rows;
        const hasGraduated = gradRows[0]?.graduated;

        await db.insert(applications).values({
            userId,
            jobId,
            status: 'applied',
        });

        res.status(201).json({
            message: 'Application submitted successfully',
            meta: { hasGraduated }
        });
    } catch (err) {
        console.error('Error applying for job:', err);
        res.status(500).json({ error: 'Failed to apply for job' });
    }
};