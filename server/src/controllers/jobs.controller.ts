import { Request, Response } from 'express';
import { eq, desc, and, gt, isNull, or } from 'drizzle-orm'; // Added missing operators
import db from '../config/db';
import { jobs, companies } from '../db/schema';
import { UserRole } from '../db/schema';

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

        // TODO: Handle jobSkills insertion here when implemented
        // if (req.body.skills?.length) { ... }

        res.status(201).json({ job: newJob });
    } catch (err) {
        console.error('Error creating job:', err);
        res.status(500).json({ error: 'Failed to create job' });
    }
};

// 2. GET /jobs - Public job board (active + non-expired only)
export const getJobs = async (req: Request, res: Response) => {
    try {
        // Timezone-safe: Compare UTC timestamps
        const now = new Date();

        const allJobs = await db
            .select({
                id: jobs.id,
                title: jobs.title,
                description: jobs.description,
                location: jobs.location,
                jobType: jobs.jobType,
                salaryMin: jobs.salaryMin,
                salaryMax: jobs.salaryMax,
                salaryCurrency: jobs.salaryCurrency,
                remote: jobs.remote,
                companyId: jobs.companyId,
                postedAt: jobs.postedAt,
                companyName: companies.name,
                companyLogo: companies.logoUrl,
            })
            .from(jobs)
            .leftJoin(companies, eq(jobs.companyId, companies.id))
            .where(
                and(
                    eq(jobs.isActive, true),
                    or(isNull(jobs.expiresAt), gt(jobs.expiresAt, now))
                )
            )
            .orderBy(desc(jobs.postedAt));

        res.json({ jobs: allJobs });
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