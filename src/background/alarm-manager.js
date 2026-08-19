/**
 * Alarm Manager Service
 * Orchestrates chrome.alarms lifecycle, reconciliation, synchronization, and fault-recovery.
 */

import { ALARM_PREFIX } from '../utils/constants.js';
import { StorageManager } from '../storage/storage-manager.js';
import { calculateNextTriggerAt } from '../utils/date-utils.js';

const isChromeAlarmsAvailable = () => {
  return typeof chrome !== 'undefined' && chrome.alarms;
};

export class AlarmManager {
  constructor() {
    this.mockAlarms = new Map();
  }

  /**
   * Schedules a chrome.alarm for a given reminder
   * @param {Object} reminder
   * @returns {Promise<boolean>}
   */
  async scheduleAlarm(reminder) {
    if (!reminder || !reminder.id || !reminder.enabled || !reminder.nextTriggerAt) {
      return false;
    }

    const alarmName = `${ALARM_PREFIX}${reminder.id}`;
    const when = Math.max(Date.now() + 1000, reminder.nextTriggerAt);

    if (!isChromeAlarmsAvailable()) {
      this.mockAlarms.set(alarmName, { name: alarmName, scheduledTime: when });
      return true;
    }

    return new Promise((resolve) => {
      chrome.alarms.create(alarmName, { when }, () => {
        if (chrome.runtime?.lastError) {
          console.error(`[AlarmManager] Failed to create alarm for ${reminder.id}:`, chrome.runtime.lastError);
          resolve(false);
          return;
        }
        console.log(`[AlarmManager] Scheduled alarm ${alarmName} at ${new Date(when).toLocaleString()}`);
        resolve(true);
      });
    });
  }

  /**
   * Cancels an alarm for a given reminder
   * @param {string} reminderId
   * @returns {Promise<boolean>}
   */
  async cancelAlarm(reminderId) {
    const alarmName = `${ALARM_PREFIX}${reminderId}`;

    if (!isChromeAlarmsAvailable()) {
      this.mockAlarms.delete(alarmName);
      return true;
    }

    return new Promise((resolve) => {
      chrome.alarms.clear(alarmName, (wasCleared) => {
        console.log(`[AlarmManager] Cleared alarm ${alarmName}: ${wasCleared}`);
        resolve(wasCleared);
      });
    });
  }

  /**
   * Creates a custom alarm (e.g. for snooze)
   * @param {string} name
   * @param {number} when
   * @returns {Promise<boolean>}
   */
  async createCustomAlarm(name, when) {
    if (!isChromeAlarmsAvailable()) {
      this.mockAlarms.set(name, { name, scheduledTime: when });
      return true;
    }

    return new Promise((resolve) => {
      chrome.alarms.create(name, { when }, () => {
        resolve(!chrome.runtime?.lastError);
      });
    });
  }

  /**
   * Reconciles and synchronizes all alarms with the storage database.
   * Runs on browser startup, extension install/update, and service worker boot.
   * @returns {Promise<{ synced: number, cleared: number }>}
   */
  async syncAllAlarms() {
    console.log('[AlarmManager] Starting alarm synchronization...');
    const reminders = await StorageManager.getReminders();
    const now = Date.now();

    let synced = 0;
    let cleared = 0;

    if (!isChromeAlarmsAvailable()) {
      // In mock mode
      this.mockAlarms.clear();
      for (const reminder of reminders) {
        if (reminder.enabled) {
          if (!reminder.nextTriggerAt || reminder.nextTriggerAt <= now) {
            reminder.nextTriggerAt = calculateNextTriggerAt(reminder.schedule, now);
            await StorageManager.saveReminder(reminder);
          }
          if (reminder.nextTriggerAt > 0) {
            await this.scheduleAlarm(reminder);
            synced++;
          }
        }
      }
      return { synced, cleared };
    }

    return new Promise((resolve) => {
      chrome.alarms.getAll(async (activeAlarms) => {
        const activeAlarmNames = new Set((activeAlarms || []).map((a) => a.name));
        const validReminderAlarmNames = new Set();

        for (const reminder of reminders) {
          const alarmName = `${ALARM_PREFIX}${reminder.id}`;

          if (reminder.enabled) {
            validReminderAlarmNames.add(alarmName);

            // If nextTriggerAt is in the past, recalculate
            if (!reminder.nextTriggerAt || reminder.nextTriggerAt <= now) {
              reminder.nextTriggerAt = calculateNextTriggerAt(reminder.schedule, now);
              await StorageManager.saveReminder(reminder);
            }

            if (reminder.nextTriggerAt > 0) {
              await this.scheduleAlarm(reminder);
              synced++;
            }
          }
        }

        // Clean up orphan reminder alarms
        for (const alarm of activeAlarms || []) {
          if (alarm.name.startsWith(ALARM_PREFIX) && !validReminderAlarmNames.has(alarm.name)) {
            chrome.alarms.clear(alarm.name);
            cleared++;
            console.log(`[AlarmManager] Removed orphan alarm ${alarm.name}`);
          }
        }

        console.log(`[AlarmManager] Alarm sync completed. Synced: ${synced}, Cleared orphan: ${cleared}`);
        resolve({ synced, cleared });
      });
    });
  }
}
