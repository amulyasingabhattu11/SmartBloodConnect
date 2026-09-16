import { AppError } from '../utils/AppError.js';
import { getNotifications, markViewed } from '../services/notificationService.js';

export const listNotifications = async (req, res) => {
  const notifications = await getNotifications(req.user.user_id);
  res.json({ notifications });
};

export const readNotification = async (req, res) => {
  const notification = await markViewed(req.params.id, req.user.user_id);
  if (!notification) throw new AppError('Notification was not found.', 404);
  res.json({ notification });
};

