// src/controllers/notification.controller.ts
import { Response } from 'express';
import { eq, and, desc, sql } from 'drizzle-orm';
import db from '../config/db';
import { notifications } from '../db/schema';
import { AuthRequest } from './jobs.controller';

// GET /notifications — Get the current user's notifications
export const getMyNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userNotifications = await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, user.id))
            .orderBy(desc(notifications.createdAt))
            .limit(50); // Cap to last 50 for performance

        const unreadCount = userNotifications.filter(n => !n.isRead).length;

        res.json({ notifications: userNotifications, unreadCount });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// PATCH /notifications/:id/read — Mark a single notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const notificationId = parseInt(req.params.id as string);
        if (isNaN(notificationId)) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }

        const [updated] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, user.id) // Ownership check
                )
            )
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

// PATCH /notifications/read-all — Mark all the user's notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.userId, user.id),
                    eq(notifications.isRead, false)
                )
            );

        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
};
