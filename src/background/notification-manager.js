/**
 * Notification Manager Service
 * Manages desktop notifications via chrome.notifications API with action buttons and interaction handling.
 */

import { NOTIFICATION_PRIORITIES } from '../utils/constants.js';

const isChromeNotificationsAvailable = () => {
  return typeof chrome !== 'undefined' && chrome.notifications;
};

export class NotificationManager {
  constructor(onActionCallback) {
    this.onActionCallback = onActionCallback;
    this.setupListeners();
  }

  /**
   * Sets up notification click listeners
   */
  setupListeners() {
    if (!isChromeNotificationsAvailable()) return;

    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
      console.log(`[NotificationManager] Button clicked on ${notificationId}, index: ${buttonIndex}`);
      if (this.onActionCallback) {
        if (buttonIndex === 0) {
          // Button 0: "Đã hiểu" (Acknowledge)
          this.onActionCallback('ACKNOWLEDGE', notificationId);
        } else if (buttonIndex === 1) {
          // Button 1: "Nhắc lại sau 5 phút" (Snooze)
          this.onActionCallback('SNOOZE', notificationId);
        }
      }
      chrome.notifications.clear(notificationId);
    });

    chrome.notifications.onClicked.addListener((notificationId) => {
      console.log(`[NotificationManager] Notification body clicked: ${notificationId}`);
      if (this.onActionCallback) {
        this.onActionCallback('CLICK', notificationId);
      }
      chrome.notifications.clear(notificationId);
    });
  }

  /**
   * Displays desktop notification for a reminder
   * @param {Object} reminder
   * @param {Object} settings
   * @returns {Promise<string|null>}
   */
  async showNotification(reminder, settings) {
    if (!isChromeNotificationsAvailable()) {
      console.log(`[NotificationManager Mock] "${reminder.title}": ${reminder.message || 'Đã đến thời gian sự kiện!'}`);
      return reminder.id;
    }

    const priorityMap = {
      [NOTIFICATION_PRIORITIES.LOW]: 0,
      [NOTIFICATION_PRIORITIES.NORMAL]: 1,
      [NOTIFICATION_PRIORITIES.HIGH]: 2,
    };

    const priorityLevel = priorityMap[reminder.notification?.priority || settings?.notifications?.priority] ?? 1;

    const options = {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
      title: reminder.title,
      message: reminder.message && reminder.message.trim().length > 0
        ? reminder.message
        : 'Đã đến thời gian diễn ra sự kiện!',
      contextMessage: 'Event Reminder',
      priority: priorityLevel,
      requireInteraction: priorityLevel === 2, // High priority stays on screen
      buttons: [
        { title: '✓ Đã hiểu' },
        { title: '⏰ Nhắc lại sau 5 phút' },
      ],
    };

    const notificationId = `notif_${reminder.id}_${Date.now()}`;

    return new Promise((resolve) => {
      chrome.notifications.create(notificationId, options, (createdId) => {
        if (chrome.runtime?.lastError) {
          console.error('[NotificationManager] Failed to create notification:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        console.log(`[NotificationManager] Notification shown: ${createdId}`);
        resolve(createdId);
      });
    });
  }
}
