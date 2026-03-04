// src/routes/notification.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
} from '../controllers/notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET   /notifications          — fetch all notifications + unreadCount
router.get('/', getMyNotifications);

// PATCH /notifications/read-all — mark all as read (MUST be before /:id)
router.patch('/read-all', markAllAsRead);

// PATCH /notifications/:id/read — mark single notification as read
router.patch('/:id/read', markAsRead);

export default router;
