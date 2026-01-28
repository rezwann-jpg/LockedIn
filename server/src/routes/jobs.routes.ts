import { Router } from 'express';
import { createJob, getJobs, getCompanyJobs, getMatchedJobs } from '../controllers/jobs.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public: View all jobs
router.get('/', getJobs);

// Seekers: Get personalized matches
router.get('/matched', authenticate, getMatchedJobs);

export default router;
