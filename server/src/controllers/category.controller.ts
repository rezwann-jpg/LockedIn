import { Request, Response } from 'express';
import db from '../config/db';
import { categories } from '../db/schema';
import { desc } from 'drizzle-orm';

export const getCategories = async (req: Request, res: Response) => {
    try {
        const allCategories = await db
            .select()
            .from(categories)
            .orderBy(categories.name);

        res.json({ categories: allCategories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
