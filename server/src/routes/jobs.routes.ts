import { Router } from 'express';
import {
    createJob,
    getJobs,
    getCompanyJobs,
    getMatchedJobs,
    applyToJob,
    getMyApplications,
    getJobApplicants,
    updateApplicationStatus,
    getUserResumes,
    uploadResume,
    getMarketTrends
} from '../controllers/jobs.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public: View all jobs (Optional auth for personalized matching)
router.get('/', optionalAuthenticate, getJobs);

// Public: Market trends
router.get('/trends', getMarketTrends);

// Seekers: Get personalized matches
router.get('/matched', authenticate, getMatchedJobs);

// Seekers: Get own applications
router.get('/applications/my', authenticate, getMyApplications);

// Seekers: Apply for a job
router.post('/:id/apply', authenticate, applyToJob);

// Companies: Get applicants for a job
router.get('/:id/applicants', authenticate, getJobApplicants);

// Companies: Update application status
router.patch('/applications/:id', authenticate, updateApplicationStatus);

// Seekers: Resume management
router.get('/resumes', authenticate, getUserResumes);
router.post('/resumes', authenticate, uploadResume);

export default router;
