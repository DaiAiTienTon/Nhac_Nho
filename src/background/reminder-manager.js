/**
 * Reminder Manager Service
 * Handles business logic, state transitions, scheduling calculations, and coordination with Alarm/Notification/Audio managers.
 */

import { StorageManager } from '../storage/storage-manager.js';
import { calculateNextTriggerAt } from '../utils/date-utils.js';
import { validateReminder } from '../utils/validation.js';
import { SCHEDULE_TYPES, SOUND_IDS, NOTIFICATION_PRIORITIES } from '../utils/constants.js';

export class ReminderManager {
  constructor(alarmManager, notificationManager, audioManager) {
    this.alarmManager = alarmManager;
    this.notificationManager = notificationManager;
    this.audioManager = audioManager;
  }

  /**
   * Generates a unique reminder ID
   * @returns {string}
   */
  generateId() {
    return 'rem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }

  /**
   * Creates and schedules a new reminder
   * @param {Object} data
   * @returns {Promise<{ success: boolean, reminder?: Object, error?: string }>}
   */
  async createReminder(data) {
    const id = this.generateId();
    const now = Date.now();

    const reminder = {
      id,
      title: data.title?.trim() || '',
      message: data.message?.trim() || '',
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      schedule: {
        type: data.schedule?.type || SCHEDULE_TYPES.DAILY,
        time: data.schedule?.time || '08:00',
        date: data.schedule?.date || '',
        days: Array.isArray(data.schedule?.days) ? data.schedule.days : [1, 2, 3, 4, 5],
        intervalMinutes: data.schedule?.intervalMinutes ? Number(data.schedule.intervalMinutes) : 30,
      },
      notification: {
        enabled: data.notification?.enabled !== undefined ? Boolean(data.notification.enabled) : true,
        priority: data.notification?.priority || NOTIFICATION_PRIORITIES.NORMAL,
      },
      sound: {
        enabled: data.sound?.enabled !== undefined ? Boolean(data.sound.enabled) : true,
        soundId: data.sound?.soundId || SOUND_IDS.DEFAULT,
      },
      createdAt: now,
      updatedAt: now,
      nextTriggerAt: 0,
    };

    const validation = validateReminder(reminder);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    if (reminder.enabled) {
      reminder.nextTriggerAt = calculateNextTriggerAt(reminder.schedule, now);
    } else {
      reminder.nextTriggerAt = 0;
    }

    const saveResult = await StorageManager.saveReminder(reminder);
    if (!saveResult.success) {
      return saveResult;
    }

    if (reminder.enabled && reminder.nextTriggerAt > 0 && this.alarmManager) {
      await this.alarmManager.scheduleAlarm(reminder);
    }

    return { success: true, reminder };
  }

  /**
   * Updates an existing reminder and synchronizes its alarm
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<{ success: boolean, reminder?: Object, error?: string }>}
   */
  async updateReminder(id, data) {
    const existing = await StorageManager.getReminderById(id);
    if (!existing) {
      return { success: false, error: 'Không tìm thấy lời nhắc cần cập nhật.' };
    }

    const now = Date.now();
    const updated = {
      ...existing,
      ...data,
      id,
      schedule: { ...existing.schedule, ...(data.schedule || {}) },
      notification: { ...existing.notification, ...(data.notification || {}) },
      sound: { ...existing.sound, ...(data.sound || {}) },
      updatedAt: now,
    };

    const validation = validateReminder(updated);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    if (updated.enabled) {
      updated.nextTriggerAt = calculateNextTriggerAt(updated.schedule, now);
    } else {
      updated.nextTriggerAt = 0;
    }

    const saveResult = await StorageManager.saveReminder(updated);
    if (!saveResult.success) {
      return saveResult;
    }

    if (this.alarmManager) {
      if (updated.enabled && updated.nextTriggerAt > 0) {
        await this.alarmManager.scheduleAlarm(updated);
      } else {
        await this.alarmManager.cancelAlarm(id);
      }
    }

    return { success: true, reminder: updated };
  }

  /**
   * Deletes a reminder and cancels its alarm
   * @param {string} id
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async deleteReminder(id) {
    if (this.alarmManager) {
      await this.alarmManager.cancelAlarm(id);
    }
    return StorageManager.deleteReminder(id);
  }

  /**
   * Toggles enabled state of a reminder
   * @param {string} id
   * @param {boolean} enabled
   * @returns {Promise<{ success: boolean, reminder?: Object, error?: string }>}
   */
  async toggleReminder(id, enabled) {
    const reminder = await StorageManager.getReminderById(id);
    if (!reminder) {
      return { success: false, error: 'Không tìm thấy lời nhắc.' };
    }

    reminder.enabled = Boolean(enabled);
    const now = Date.now();

    if (reminder.enabled) {
      reminder.nextTriggerAt = calculateNextTriggerAt(reminder.schedule, now);
    } else {
      reminder.nextTriggerAt = 0;
    }

    const saveResult = await StorageManager.saveReminder(reminder);
    if (!saveResult.success) {
      return saveResult;
    }

    if (this.alarmManager) {
      if (reminder.enabled && reminder.nextTriggerAt > 0) {
        await this.alarmManager.scheduleAlarm(reminder);
      } else {
        await this.alarmManager.cancelAlarm(id);
      }
    }

    return { success: true, reminder };
  }

  /**
   * Handles alarm trigger event from background service worker
   * @param {string} reminderId
   */
  async handleAlarmTriggered(reminderId) {
    const reminder = await StorageManager.getReminderById(reminderId);
    if (!reminder || !reminder.enabled) {
      // Stale or disabled alarm, clean it up
      if (this.alarmManager) {
        await this.alarmManager.cancelAlarm(reminderId);
      }
      return;
    }

    const settings = await StorageManager.getSettings();
    if (!settings.enabled) {
      console.log('[ReminderManager] Global reminders disabled. Skipping notification.');
      return;
    }

    // 1. Trigger desktop notification
    if (settings.notifications.enabled && reminder.notification.enabled && this.notificationManager) {
      await this.notificationManager.showNotification(reminder, settings);
    }

    // 2. Trigger audio playback
    if (settings.audio.enabled && reminder.sound.enabled && reminder.sound.soundId !== SOUND_IDS.NONE && this.audioManager) {
      const soundId = reminder.sound.soundId || settings.audio.defaultSound;
      await this.audioManager.playSound(soundId, settings.audio.volume);
    }

    // 3. Handle reschedule / next trigger
    const now = Date.now();
    if (reminder.schedule.type === SCHEDULE_TYPES.ONE_TIME) {
      // One-time reminder is marked as completed/disabled
      reminder.enabled = false;
      reminder.nextTriggerAt = 0;
      await StorageManager.saveReminder(reminder);
      if (this.alarmManager) {
        await this.alarmManager.cancelAlarm(reminder.id);
      }
    } else {
      // Recurring schedule: calculate next occurrence
      reminder.nextTriggerAt = calculateNextTriggerAt(reminder.schedule, now + 1000); // add 1s to prevent same ms loop
      await StorageManager.saveReminder(reminder);
      if (this.alarmManager && reminder.nextTriggerAt > 0) {
        await this.alarmManager.scheduleAlarm(reminder);
      }
    }
  }

  /**
   * Snoozes a reminder for specified minutes (default 5 min)
   * @param {string} reminderId
   * @param {number} [minutes=5]
   */
  async snoozeReminder(reminderId, minutes = 5) {
    const reminder = await StorageManager.getReminderById(reminderId);
    if (!reminder) return;

    const snoozeTime = Date.now() + minutes * 60 * 1000;
    if (this.alarmManager) {
      await this.alarmManager.createCustomAlarm(`snooze_${reminderId}`, snoozeTime);
    }
  }

  /**
   * Retrieves the nearest upcoming active reminder
   * @returns {Promise<Object|null>}
   */
  async getNextActiveReminder() {
    const reminders = await StorageManager.getReminders();
    const active = reminders.filter((r) => r.enabled && r.nextTriggerAt > Date.now());
    if (active.length === 0) return null;

    active.sort((a, b) => a.nextTriggerAt - b.nextTriggerAt);
    return active[0];
  }
}
