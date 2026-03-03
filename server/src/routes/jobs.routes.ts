import { Router } from 'express';
import {
    createJob,
    getJobs,
    getJobById,
    getCompanyJobs,
    getMatchedJobs,
    applyToJob,
    getMyApplications,
    getJobApplicants,
    updateApplicationStatus,
    getUserResumes,
    uploadResume,
    deleteResume,
    getMarketTrends
} from '../controllers/jobs.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public: View all jobs (Optional auth for personalized matching)
router.get('/', optionalAuthenticate, getJobs);

// Public: Market trends — MUST be before /:id
router.get('/trends', getMarketTrends);

// Seekers: Personalized matches — MUST be before /:id
router.get('/matched', authenticate, getMatchedJobs);

// Seekers: Own applications — MUST be before /:id
router.get('/applications/my', authenticate, getMyApplications);

// Companies: Update application status
router.patch('/applications/:id', authenticate, updateApplicationStatus);

// Seekers: Resume management — MUST be before /:id
router.get('/resumes', authenticate, getUserResumes);
router.post('/resumes', authenticate, uploadResume);
router.delete('/resumes/:id', authenticate, deleteResume);

// Public: Get job by ID — wildcard must come LAST
router.get('/:id', getJobById);

// Seekers: Apply for a job
router.post('/:id/apply', authenticate, applyToJob);

// Companies: Get applicants for a job
router.get('/:id/applicants', authenticate, getJobApplicants);

export default router;
