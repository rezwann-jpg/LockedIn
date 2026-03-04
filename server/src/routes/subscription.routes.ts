// src/routes/subscription.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    subscribeToCompany,
    unsubscribeFromCompany,
    getMySubscriptions,
    checkSubscription,
    getCompanySubscribers,
} from '../controllers/subscription.controller';

const router = Router();

// All subscription routes require authentication
router.use(authenticate);

// GET  /subscriptions/subscribers        — list users subscribed to my company (Employer/Company only)
router.get('/subscribers', getCompanySubscribers);

// GET  /subscriptions/companies          — list my subscribed companies (Seeker only)
router.get('/companies', getMySubscriptions);

// GET  /subscriptions/check/:companyId   — check if subscribed (used by SubscribeButton)
router.get('/check/:companyId', checkSubscription);

// POST /subscriptions/companies/:companyId  — subscribe
router.post('/companies/:companyId', subscribeToCompany);

// DELETE /subscriptions/companies/:companyId — unsubscribe
router.delete('/companies/:companyId', unsubscribeFromCompany);

export default router;
