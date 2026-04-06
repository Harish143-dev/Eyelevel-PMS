import { Router } from 'express';
import {
  getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification,
} from '../controllers/notification.controller';
import { verifyJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
