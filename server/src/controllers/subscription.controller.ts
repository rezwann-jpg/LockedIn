// src/controllers/subscription.controller.ts
import { Response } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import db from '../config/db';
import {
    companySubscriptions,
    companies,
} from '../db/schema';
import { AuthRequest } from './jobs.controller';

// POST /subscriptions/companies/:companyId — Subscribe to a company
export const subscribeToCompany = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'job_seeker') {
            return res.status(403).json({ error: 'Only job seekers can subscribe to companies' });
        }

        const companyId = parseInt(req.params.companyId as string);
        if (isNaN(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        // Verify company exists
        const [company] = await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.id, companyId))
            .limit(1);

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Upsert subscription (ignore duplicate)
        const [subscription] = await db
            .insert(companySubscriptions)
            .values({ userId: user.id, companyId })
            .onConflictDoNothing()
            .returning();

        if (!subscription) {
            // Already subscribed — return 200 as it's idempotent
            return res.status(200).json({ message: 'Already subscribed', subscribed: true });
        }

        res.status(201).json({ message: 'Subscribed successfully', subscribed: true, subscription });
    } catch (err) {
        console.error('Error subscribing to company:', err);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
};

// DELETE /subscriptions/companies/:companyId — Unsubscribe from a company
export const unsubscribeFromCompany = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'job_seeker') {
            return res.status(403).json({ error: 'Only job seekers can unsubscribe from companies' });
        }

        const companyId = parseInt(req.params.companyId as string);
        if (isNaN(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        const [deleted] = await db
            .delete(companySubscriptions)
            .where(
                and(
                    eq(companySubscriptions.userId, user.id),
                    eq(companySubscriptions.companyId, companyId)
                )
            )
            .returning();

        if (!deleted) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json({ message: 'Unsubscribed successfully', subscribed: false });
    } catch (err) {
        console.error('Error unsubscribing from company:', err);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
};

// GET /subscriptions/companies — List my subscribed companies
export const getMySubscriptions = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'job_seeker') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const subscriptions = await db
            .select({
                id: companySubscriptions.id,
                companyId: companies.id,
                companyName: companies.name,
                companyLogo: companies.logoUrl,
                companyIndustry: companies.industry,
                subscribedAt: companySubscriptions.createdAt,
            })
            .from(companySubscriptions)
            .innerJoin(companies, eq(companySubscriptions.companyId, companies.id))
            .where(eq(companySubscriptions.userId, user.id))
            .orderBy(companySubscriptions.createdAt);

        res.json({ subscriptions });
    } catch (err) {
        console.error('Error fetching subscriptions:', err);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
};

// GET /subscriptions/check/:companyId — Check if subscribed to a company
export const checkSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.json({ subscribed: false });
        }

        const companyId = parseInt(req.params.companyId as string);
        if (isNaN(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        const [existing] = await db
            .select({ id: companySubscriptions.id })
            .from(companySubscriptions)
            .where(
                and(
                    eq(companySubscriptions.userId, user.id),
                    eq(companySubscriptions.companyId, companyId)
                )
            )
            .limit(1);

        res.json({ subscribed: !!existing });
    } catch (err) {
        console.error('Error checking subscription:', err);
        res.status(500).json({ error: 'Failed to check subscription' });
    }
};

// GET /subscriptions/subscribers — List users subscribed to my company (Employer/Company only)
export const getCompanySubscribers = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'company') {
            return res.status(403).json({ error: 'Access denied. Only company accounts can view subscribers.' });
        }

        // Get the company ID for this user
        const [company] = await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.userId, user.id))
            .limit(1);

        if (!company) {
            return res.status(404).json({ error: 'Company profile not found' });
        }

        // Fetch subscribers with user details
        const subscribersWithDetails = await db.execute(sql`
            SELECT 
                cs.id,
                u.id as "userId",
                u.name as "userName",
                u.email as "userEmail",
                cs.created_at as "subscribedAt"
            FROM company_subscriptions cs
            JOIN users u ON cs.user_id = u.id
            WHERE cs.company_id = ${company.id}
            ORDER BY cs.created_at DESC
        `);

        res.json({ subscribers: subscribersWithDetails.rows });
    } catch (err) {
        console.error('Error fetching company subscribers:', err);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
};
