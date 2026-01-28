import { Request, Response } from 'express';
import db from '../config/db';
import { skills } from '../db/schema';
import { ilike } from 'drizzle-orm';

export const getSkills = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        let query = db.select().from(skills);

        if (search && typeof search === 'string') {
            query = query.where(ilike(skills.name, `%${search}%`)) as any;
        }

        const results = await query.limit(20);
        res.json({ skills: results });
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
};
