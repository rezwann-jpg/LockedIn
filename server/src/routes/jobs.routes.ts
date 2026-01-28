import { Router } from 'express';
import { createJob, getJobs, getCompanyJobs, getMatchedJobs } from '../controllers/jobs.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Public: View all jobs (Optional auth for personalized matching)
router.get('/', optionalAuthenticate, getJobs);

// Seekers: Get personalized matches
router.get('/matched', authenticate, getMatchedJobs);

export default router;
