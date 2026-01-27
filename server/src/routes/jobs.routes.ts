import { Router } from 'express';
import { createJob, getJobs, getCompanyJobs } from '../controllers/jobs.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public: View all jobs
router.get('/', getJobs);

export default router;
