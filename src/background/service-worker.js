/**
 * Background Service Worker (Manifest V3)
 * Central orchestration for Event Reminder Chrome Extension.
 */

import { AlarmManager } from './alarm-manager.js';
import { NotificationManager } from './notification-manager.js';
import { AudioManager } from './audio-manager.js';
import { ReminderManager } from './reminder-manager.js';
import { StorageManager } from '../storage/storage-manager.js';
import { ALARM_PREFIX, MESSAGE_TYPES, SOUND_FILES } from '../utils/constants.js';

console.log('[ServiceWorker] Initializing Event Reminder Service Worker...');

// Instantiate services
const alarmManager = new AlarmManager();
const audioManager = new AudioManager();

const notificationManager = new NotificationManager(async (action, notificationId) => {
  console.log(`[ServiceWorker] Notification callback: ${action} on ${notificationId}`);
  // notificationId format: notif_<reminderId>_<timestamp>
  const parts = notificationId.split('_');
  if (parts.length >= 2) {
    const reminderId = parts[1];
    if (action === 'SNOOZE') {
      await reminderManager.snoozeReminder(reminderId, 5);
    }
  }
});

const reminderManager = new ReminderManager(alarmManager, notificationManager, audioManager);

/**
 * Initializes the scheduler, loads settings and syncs alarms with storage
 */
async function initializeScheduler() {
  try {
    console.log('[ServiceWorker] Initializing Scheduler...');
    await StorageManager.getSettings(); // Ensures default settings exist
    const { synced, cleared } = await alarmManager.syncAllAlarms();
    console.log(`[ServiceWorker] Scheduler ready. Synced: ${synced}, Cleared: ${cleared}`);
  } catch (err) {
    console.error('[ServiceWorker] Initialization error:', err);
  }
}

// 1. Lifecycle Events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`[ServiceWorker] Extension installed/updated (${details.reason})`);
  await initializeScheduler();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[ServiceWorker] Chrome startup detected.');
  await initializeScheduler();
});

// Always ensure alarms are synced on worker boot
initializeScheduler();

// 2. Alarm Events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log(`[ServiceWorker] Alarm fired: ${alarm.name}`);

  if (alarm.name.startsWith(ALARM_PREFIX)) {
    const reminderId = alarm.name.replace(ALARM_PREFIX, '');
    await reminderManager.handleAlarmTriggered(reminderId);
  } else if (alarm.name.startsWith('snooze_')) {
    const reminderId = alarm.name.replace('snooze_', '');
    await reminderManager.handleAlarmTriggered(reminderId);
    chrome.alarms.clear(alarm.name);
  }
});

// 3. Message Handling from Popup / Options UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  const handleMessage = async () => {
    switch (message.type) {
      case MESSAGE_TYPES.GET_SETTINGS: {
        const settings = await StorageManager.getSettings();
        return { success: true, settings };
      }

      case MESSAGE_TYPES.SAVE_SETTINGS: {
        const result = await StorageManager.saveSettings(message.settings);
        return result;
      }

      case MESSAGE_TYPES.GET_REMINDERS: {
        const reminders = await StorageManager.getReminders();
        const nextReminder = await reminderManager.getNextActiveReminder();
        return { success: true, reminders, nextReminder };
      }

      case MESSAGE_TYPES.SAVE_REMINDER: {
        if (message.reminder.id) {
          return await reminderManager.updateReminder(message.reminder.id, message.reminder);
        } else {
          return await reminderManager.createReminder(message.reminder);
        }
      }

      case MESSAGE_TYPES.DELETE_REMINDER: {
        return await reminderManager.deleteReminder(message.id);
      }

      case MESSAGE_TYPES.TOGGLE_REMINDER: {
        return await reminderManager.toggleReminder(message.id, message.enabled);
      }

      case MESSAGE_TYPES.TEST_SOUND: {
        const settings = await StorageManager.getSettings();
        const soundId = message.soundId || settings.audio.defaultSound;
        const volume = message.volume !== undefined ? message.volume : settings.audio.volume;
        const success = await audioManager.playSound(soundId, volume);
        return { success };
      }

      case MESSAGE_TYPES.SYNC_ALARMS: {
        const syncResult = await alarmManager.syncAllAlarms();
        return { success: true, ...syncResult };
      }

      default:
        return { success: false, error: 'Unknown message type: ' + message.type };
    }
  };

  handleMessage()
    .then(sendResponse)
    .catch((err) => sendResponse({ success: false, error: err.message }));

  return true; // Keep message port open for async response
});
