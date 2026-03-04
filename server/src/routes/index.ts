import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller';
import { getUserProfile, updateUserProfile } from '../controllers/profile.controller';
import { validateSignup, validateLogin } from '../middleware/validate';
import { authenticate } from '../middleware/auth.middleware';
import { getSkills } from '../controllers/skills.controller';
import { getCategories } from '../controllers/category.controller';

import jobsRoutes from './jobs.routes';
import companyRoutes from './company.routes';
import subscriptionRoutes from './subscription.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);
router.use('/jobs', jobsRoutes);
router.use('/company', companyRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/notifications', notificationRoutes);

router.get('/skills', getSkills);
router.get('/categories', getCategories);

export default router;
