import Notification from '../Models/Notification.js';

// Dispatch a notification
export const dispatchNotification = async ({ 
  recipient = null, 
  recipientRole = 'all', 
  title, 
  message, 
  type, 
  metadata = {} 
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      recipientRole: recipientRole || 'all',
      title,
      message,
      type,
      metadata,
    });

    console.log(`[Notification Logged]: ${title} for target role: ${recipientRole}`);
    return notification;
  } catch (error) {
    console.error('Error dispatching notification:', error.message);
    return null;
  }
};
