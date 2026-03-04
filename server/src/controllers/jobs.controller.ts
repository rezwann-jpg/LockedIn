import { Request, Response } from 'express';
import { eq, desc, and, gt, isNull, or } from 'drizzle-orm'; // Added missing operators
import db from '../config/db';
import { jobs, companies, skills, jobSkills, applications, users, userResumes, applicationHistory, companySubscriptions, notifications } from '../db/schema';
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


import { getJobsListing } from '../db/queries';

// 2. GET /jobs - Public job board (active + non-expired only)
export const getJobs = async (req: Request, res: Response) => {
    try {
        const { sort, categoryId, search, jobType, location, salaryMin, remote, limit, offset } = req.query;
        const user = (req as any).user;

        const jobsListing = await getJobsListing({
            categoryId: categoryId ? parseInt(categoryId as string) : undefined,
            search: search as string,
            sortBy: sort as any,
            userId: user?.id,
            jobType: jobType as string,
            location: location as string,
            salaryMin: salaryMin ? parseInt(salaryMin as string) : undefined,
            remote: remote !== undefined ? remote === 'true' : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
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

// GET /jobs/:id - Get a single job by ID
export const getJobById = async (req: Request, res: Response) => {
    try {
        const jobId = parseInt(req.params.id as string);
        if (isNaN(jobId)) {
            return res.status(400).json({ error: 'Invalid job ID' });
        }

        const jobWithDetails = await db
            .select({
                job: jobs,
                company: companies,
                skills: sql`array_agg(${skills.name})`.as('job_skills')
            })
            .from(jobs)
            .innerJoin(companies, eq(jobs.companyId, companies.id))
            .leftJoin(jobSkills, eq(jobs.id, jobSkills.jobId))
            .leftJoin(skills, eq(jobSkills.skillId, skills.id))
            .where(eq(jobs.id, jobId))
            .groupBy(jobs.id, companies.id);

        if (!jobWithDetails || jobWithDetails.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Increment view count (fire-and-forget, don't await to keep response fast)
        db.update(jobs)
            .set({ viewsCount: sql`${jobs.viewsCount} + 1` })
            .where(eq(jobs.id, jobId))
            .catch(err => console.error('Failed to increment views_count:', err));

        // Format for response to be easier to work with
        const formattedJob = {
            ...jobWithDetails[0].job,
            company: jobWithDetails[0].company,
            skills: (jobWithDetails[0].skills as unknown as string[]).filter((s: string | null) => s !== null),
        };

        res.json({ job: formattedJob });
    } catch (err) {
        console.error('Error fetching job by ID:', err);
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};

// PUT /company/jobs/:id - Update job (Company only)
export const updateJob = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const jobId = parseInt(req.params.id as string);

        if (isNaN(jobId)) {
            return res.status(400).json({ error: 'Invalid job ID' });
        }

        if (!user || user.role !== 'company') {
            return res.status(403).json({ error: 'Only companies can update jobs' });
        }

        const companyId = await getCompanyIdForUser(user.id);
        if (!companyId) {
            return res.status(400).json({
                error: 'Company profile not found.'
            });
        }

        // Check if job exists and belongs to company
        const [existingJob] = await db
            .select()
            .from(jobs)
            .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)));

        if (!existingJob) {
            return res.status(404).json({ error: 'Job not found or access denied' });
        }

        // Update the job details
        const updateData: any = {};
        const fieldsToUpdate = [
            'title', 'description', 'requirements', 'responsibilities',
            'location', 'salaryMin', 'salaryMax', 'salaryCurrency',
            'jobType', 'experienceLevel', 'categoryId', 'remote', 'isActive'
        ];

        for (const field of fieldsToUpdate) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        // Ensure salary is correctly nullified if empty
        if (updateData.salaryMin === '') updateData.salaryMin = null;
        if (updateData.salaryMax === '') updateData.salaryMax = null;
        // set updatedAt
        updateData.updatedAt = new Date();

        const [updatedJob] = await db.update(jobs)
            .set(updateData)
            .where(eq(jobs.id, jobId))
            .returning();

        // Handle skills insertion/update
        if (req.body.skills && Array.isArray(req.body.skills)) {
            const skillNames = req.body.skills.filter((s: any) => typeof s === 'string');
            const skillArraySql = sql`ARRAY[${skillNames.length > 0 ? sql.join(skillNames.map((s: string) => sql`${s}`), sql`, `) : sql`''`}]::TEXT[]`;
            // Ensure if empty array we pass an empty array to update_job_skills
            if (skillNames.length > 0) {
                await db.execute(sql`CALL update_job_skills(${jobId}::INT, ${skillArraySql})`);
            } else {
                // If they cleared all skills, we should delete them
                await db.delete(jobSkills).where(eq(jobSkills.jobId, jobId));
            }
        }

        res.json({ job: updatedJob, message: 'Job updated successfully' });
    } catch (err) {
        console.error('Error updating job:', err);
        res.status(500).json({ error: 'Failed to update job' });
    }
};

// 4. GET /jobs/matched - Recommended jobs for user
export const getMatchedJobs = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'job_seeker') {
            return res.status(403).json({ error: 'Only job seekers can get matched jobs' });
        }

        const matchedJobs = await getJobsListing({ userId: user.id, sortBy: 'match', limit: 10 });
        res.json({ jobs: matchedJobs });
    } catch (err) {
        console.error('Error fetching matched jobs:', err);
        res.status(500).json({ error: 'Failed to fetch matched jobs' });
    }
};

// 4.1 GET /resumes - List resumes
export const getUserResumes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!req.user || req.user.role !== 'job_seeker') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const resumes = await db.select().from(userResumes).where(eq(userResumes.userId, userId!));
        res.json({ resumes });
    } catch (err) {
        console.error('Error fetching resumes:', err);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
};

// 4.2 POST /resumes - Upload/Create resume
export const uploadResume = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { versionName, searchText, parsedContent, isMain } = req.body;

        if (!req.user || req.user.role !== 'job_seeker') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [newResume] = await db.insert(userResumes).values({
            userId: userId!,
            versionName: versionName || 'Default',
            searchText,
            parsedContent,
            isMain: !!isMain,
        }).returning();

        res.status(201).json({ resume: newResume });
    } catch (err) {
        console.error('Error uploading resume:', err);
        res.status(500).json({ error: 'Failed to upload resume' });
    }
};

// 4.3 DELETE /resumes/:id - Delete resume
export const deleteResume = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const resumeId = parseInt(req.params.id as string);

        if (!req.user || req.user.role !== 'job_seeker') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (isNaN(resumeId)) {
            return res.status(400).json({ error: 'Invalid resume ID' });
        }

        // Verify the resume belongs to this user before deleting
        const [existing] = await db
            .select({ id: userResumes.id })
            .from(userResumes)
            .where(and(eq(userResumes.id, resumeId), eq(userResumes.userId, userId!)))
            .limit(1);

        if (!existing) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        await db.delete(userResumes).where(eq(userResumes.id, resumeId));
        res.json({ message: 'Resume deleted successfully' });
    } catch (err) {
        console.error('Error deleting resume:', err);
        res.status(500).json({ error: 'Failed to delete resume' });
    }
};

// 5. POST /jobs/:id/apply - Apply for a job using STORED PROCEDURE
export const applyToJob = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        console.log('Backend applyToJob - Received jobId param:', req.params.id);
        const jobId = parseInt(req.params.id as string);
        const { coverLetter, resumeId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (isNaN(jobId)) {
            return res.status(400).json({ error: 'Invalid job ID' });
        }

        // Use the submit_job_application procedure for transactional safety
        await db.execute(sql`
            CALL submit_job_application(
                ${userId}::INT, 
                ${jobId}::INT, 
                ${resumeId ? sql`${resumeId}::INT` : sql`NULL`}, 
                ${coverLetter || ''}
            )
        `);

        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (err: any) {
        console.error('Error applying for job via procedure:', err);
        // Handle RAISE EXCEPTION from Postgres
        if (err.message.includes('already applied') || err.message.includes('no longer active')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to apply for job' });
    }
};

// 6. GET /jobs/applications/my - Get seeker's own applications with history
export const getMyApplications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const myApps = await db
            .select({
                id: applications.id,
                status: applications.status,
                appliedAt: applications.appliedAt,
                jobTitle: jobs.title,
                companyName: companies.name,
                location: jobs.location,
            })
            .from(applications)
            .innerJoin(jobs, eq(applications.jobId, jobs.id))
            .innerJoin(companies, eq(jobs.companyId, companies.id))
            .where(eq(applications.userId, userId))
            .orderBy(desc(applications.appliedAt));

        // Get history for these applications
        const appIds = myApps.map(a => a.id);
        if (appIds.length > 0) {
            const history = await db
                .select()
                .from(applicationHistory)
                .where(sql`${applicationHistory.applicationId} IN (${sql.join(appIds, sql`, `)})`)
                .orderBy(desc(applicationHistory.createdAt));

            const appsWithHistory = myApps.map(app => ({
                ...app,
                history: history.filter(h => h.applicationId === app.id)
            }));
            return res.json({ applications: appsWithHistory });
        }

        res.json({ applications: myApps });
    } catch (err) {
        console.error('Error fetching applications:', err);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

// 7. GET /jobs/:id/applicants - Get applicants for a job (Company only) with keyword search
export const getJobApplicants = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const jobId = parseInt(req.params.id as string);
        const { keyword } = req.query; // New: Full-text search keyword

        if (!userId || req.user?.role !== 'company') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = await getCompanyIdForUser(userId);

        // Prepare keyword search query if provided
        const searchFilter = keyword
            ? sql`AND ur.search_vector @@ plainto_tsquery('english', ${keyword as string})`
            : sql``;

        const query = sql`
            SELECT 
                a.id,
                a.status,
                a.applied_at as "appliedAt",
                u.name as "userName",
                u.email as "userEmail",
                a.cover_letter as "coverLetter",
                a.resume_url as "resumeUrl",
                ur.id as "resumeId",
                ur.version_name as "resumeVersion",
                ts_headline('english', ur.search_text, plainto_tsquery('english', ${keyword || ''})) as "searchHighlight"
            FROM ${applications} a
            INNER JOIN ${users} u ON a.user_id = u.id
            INNER JOIN ${jobs} j ON a.job_id = j.id
            LEFT JOIN ${userResumes} ur ON a.user_id = ur.user_id AND ur.is_main = true
            WHERE a.job_id = ${jobId}
                AND j.company_id = ${companyId!}
                ${searchFilter}
            ORDER BY a.applied_at DESC
        `;

        const result = await db.execute(query);
        res.json({ applicants: result.rows });
    } catch (err) {
        console.error('Error fetching applicants:', err);
        res.status(500).json({ error: 'Failed to fetch applicants' });
    }
};

// 8. PATCH /jobs/applications/:id - Update application status (Company only)
export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const applicationId = parseInt(req.params.id as string);
        const { status } = req.body;

        if (!userId || req.user?.role !== 'company') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const companyId = await getCompanyIdForUser(userId);

        // Verify application belongs to a job from this company
        const [app] = await db
            .select({ id: applications.id })
            .from(applications)
            .innerJoin(jobs, eq(applications.jobId, jobs.id))
            .where(and(eq(applications.id, applicationId), eq(jobs.companyId, companyId!)));

        if (!app) {
            return res.status(404).json({ error: 'Application not found or access denied' });
        }

        await db.update(applications)
            .set({ status, updatedAt: new Date() })
            .where(eq(applications.id, applicationId));

        res.json({ message: 'Application status updated successfully' });
    } catch (err) {
        console.error('Error updating application status:', err);
        res.status(500).json({ error: 'Failed to update application status' });
    }
};

// 9. GET /api/jobs/trends - Get market trends analytics (Public)
export const getMarketTrends = async (_req: Request, res: Response) => {
    try {
        const result = await db.execute(sql`SELECT * FROM category_demand_analytics`);
        res.json({ trends: result.rows });
    } catch (err) {
        console.error('Error fetching market trends:', err);
        res.status(500).json({ error: 'Failed to fetch market trends' });
    }
};