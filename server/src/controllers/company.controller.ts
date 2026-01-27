import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import db from '../config/db';
import { companies } from '../db/schema';
import { AuthRequest } from './jobs.controller'; // Reuse AuthRequest interface

// POST /company/profile - Setup company profile (required for new company users)
export const setupCompanyProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'company') {
            return res.status(403).json({ error: 'Company access required' });
        }

        // Check if profile already exists
        const existing = await db
            .select({ id: companies.id })
            .from(companies)
            .where(eq(companies.userId, user.id))
            .limit(1);

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Company profile already exists' });
        }

        // Validate required fields
        const { name, description, website, location, industry, size } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ error: 'Valid company name is required (min 2 characters)' });
        }

        const [profile] = await db.insert(companies).values({
            userId: user.id,
            name: name.trim(),
            description: description?.trim() || '',
            website: website?.trim() || '',
            location: location?.trim() || '',
            industry: industry?.trim() || '',
            size: size?.trim() || '1-10',
            isVerified: false,
        }).returning();

        res.status(201).json({
            message: 'Company profile created successfully',
            company: profile
        });
    } catch (err) {
        console.error('Company profile setup error:', err);
        res.status(500).json({ error: 'Failed to create company profile' });
    }
};

// GET /company/profile - Get current company profile
export const getCompanyProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'company') {
            return res.status(403).json({ error: 'Company access required' });
        }

        const [profile] = await db
            .select()
            .from(companies)
            .where(eq(companies.userId, user.id))
            .limit(1);

        if (!profile) {
            return res.status(404).json({
                error: 'Company profile not found',
                action: 'Please complete company profile setup at /company/profile'
            });
        }

        res.json({ company: profile });
    } catch (err) {
        console.error('Get company profile error:', err);
        res.status(500).json({ error: 'Failed to fetch company profile' });
    }
};