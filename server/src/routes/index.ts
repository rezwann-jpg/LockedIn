import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller';
import { getUserProfile, updateUserProfile } from '../controllers/profile.controller';
import { validateSignup, validateLogin } from '../middleware/validate';
import { authenticate } from '../middleware/auth.middleware';
import { getSkills } from '../controllers/skills.controller';
import { applyToJob } from '../controllers/jobs.controller';

import jobsRoutes from './jobs.routes';
import companyRoutes from './company.routes';

const router = Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);
router.use('/jobs', jobsRoutes);
router.use('/company', companyRoutes);

router.get('/skills', getSkills);
router.post('/jobs/:id/apply', authenticate, applyToJob);

export default router;
