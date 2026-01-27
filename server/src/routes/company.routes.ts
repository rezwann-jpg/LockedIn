import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    setupCompanyProfile,
    getCompanyProfile
} from '../controllers/company.controller';
import {
    createJob,
    getCompanyJobs
} from '../controllers/jobs.controller';

const router = Router();

router.use(authenticate);

router.get('/profile', getCompanyProfile);
router.post('/profile', setupCompanyProfile);

router.get('/jobs', getCompanyJobs);
router.post('/jobs', createJob);

export default router;