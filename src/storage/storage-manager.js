/**
 * Storage Manager Layer
 * Handles persistence using chrome.storage.local with validation and default states.
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants.js';
import { validateSettings, validateReminder, validateImportData } from '../utils/validation.js';

// In-memory mock storage for testing environments (e.g. Node.js runner)
let mockStorage = {
  [STORAGE_KEYS.SETTINGS]: { ...DEFAULT_SETTINGS },
  [STORAGE_KEYS.REMINDERS]: [],
};

const isChromeStorageAvailable = () => {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
};

export class StorageManager {
  /**
   * Retrieves full settings from storage
   * @returns {Promise<Object>}
   */
  static async getSettings() {
    if (!isChromeStorageAvailable()) {
      return { ...DEFAULT_SETTINGS, ...mockStorage[STORAGE_KEYS.SETTINGS] };
    }

    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
        if (chrome.runtime?.lastError) {
          console.error('[StorageManager] Error fetching settings:', chrome.runtime.lastError);
          resolve({ ...DEFAULT_SETTINGS });
          return;
        }
        const settings = result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
        resolve({ ...DEFAULT_SETTINGS, ...settings });
      });
    });
  }

  /**
   * Updates settings in storage
   * @param {Object} newSettings
   * @returns {Promise<{ success: boolean, settings?: Object, error?: string }>}
   */
  static async saveSettings(newSettings) {
    const current = await this.getSettings();
    const merged = {
      ...current,
      ...newSettings,
      notifications: { ...current.notifications, ...(newSettings.notifications || {}) },
      audio: { ...current.audio, ...(newSettings.audio || {}) },
    };

    const validation = validateSettings(merged);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    if (!isChromeStorageAvailable()) {
      mockStorage[STORAGE_KEYS.SETTINGS] = merged;
      return { success: true, settings: merged };
    }

    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: merged }, () => {
        if (chrome.runtime?.lastError) {
          console.error('[StorageManager] Error saving settings:', chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve({ success: true, settings: merged });
      });
    });
  }

  /**
   * Retrieves all reminders from storage
   * @returns {Promise<Array<Object>>}
   */
  static async getReminders() {
    if (!isChromeStorageAvailable()) {
      return [...(mockStorage[STORAGE_KEYS.REMINDERS] || [])];
    }

    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.REMINDERS], (result) => {
        if (chrome.runtime?.lastError) {
          console.error('[StorageManager] Error fetching reminders:', chrome.runtime.lastError);
          resolve([]);
          return;
        }
        resolve(result[STORAGE_KEYS.REMINDERS] || []);
      });
    });
  }

  /**
   * Retrieves a single reminder by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async getReminderById(id) {
    const reminders = await this.getReminders();
    return reminders.find((r) => r.id === id) || null;
  }

  /**
   * Saves or updates a reminder
   * @param {Object} reminder
   * @returns {Promise<{ success: boolean, reminder?: Object, error?: string }>}
   */
  static async saveReminder(reminder) {
    const validation = validateReminder(reminder);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const reminders = await this.getReminders();
    const index = reminders.findIndex((r) => r.id === reminder.id);
    const now = Date.now();

    let updatedReminder = {
      ...reminder,
      updatedAt: now,
    };

    if (index >= 0) {
      reminders[index] = updatedReminder;
    } else {
      updatedReminder.createdAt = updatedReminder.createdAt || now;
      reminders.push(updatedReminder);
    }

    if (!isChromeStorageAvailable()) {
      mockStorage[STORAGE_KEYS.REMINDERS] = reminders;
      return { success: true, reminder: updatedReminder };
    }

    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.REMINDERS]: reminders }, () => {
        if (chrome.runtime?.lastError) {
          console.error('[StorageManager] Error saving reminder:', chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve({ success: true, reminder: updatedReminder });
      });
    });
  }

  /**
   * Deletes a reminder by ID
   * @param {string} id
   * @returns {Promise<{ success: boolean, deletedId?: string, error?: string }>}
   */
  static async deleteReminder(id) {
    const reminders = await this.getReminders();
    const filtered = reminders.filter((r) => r.id !== id);

    if (!isChromeStorageAvailable()) {
      mockStorage[STORAGE_KEYS.REMINDERS] = filtered;
      return { success: true, deletedId: id };
    }

    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.REMINDERS]: filtered }, () => {
        if (chrome.runtime?.lastError) {
          console.error('[StorageManager] Error deleting reminder:', chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve({ success: true, deletedId: id });
      });
    });
  }

  /**
   * Toggles the enabled state of a reminder
   * @param {string} id
   * @param {boolean} enabled
   * @returns {Promise<{ success: boolean, reminder?: Object, error?: string }>}
   */
  static async toggleReminder(id, enabled) {
    const reminder = await this.getReminderById(id);
    if (!reminder) {
      return { success: false, error: 'Không tìm thấy lời nhắc.' };
    }
    reminder.enabled = Boolean(enabled);
    return this.saveReminder(reminder);
  }

  /**
   * Resets all reminders and settings to defaults
   * @returns {Promise<boolean>}
   */
  static async resetAll() {
    mockStorage = {
      [STORAGE_KEYS.SETTINGS]: { ...DEFAULT_SETTINGS },
      [STORAGE_KEYS.REMINDERS]: [],
    };

    if (!isChromeStorageAvailable()) {
      return true;
    }

    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        chrome.storage.local.set(
          {
            [STORAGE_KEYS.SETTINGS]: { ...DEFAULT_SETTINGS },
            [STORAGE_KEYS.REMINDERS]: [],
          },
          () => resolve(true)
        );
      });
    });
  }

  /**
   * Exports all data as JSON
   * @returns {Promise<Object>}
   */
  static async exportData() {
    const settings = await this.getSettings();
    const reminders = await this.getReminders();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      reminders,
    };
  }

  /**
   * Imports data with strict schema validation
   * @param {Object} data
   * @returns {Promise<{ success: boolean, importedCount?: number, error?: string }>}
   */
  static async importData(data) {
    const validation = validateImportData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    if (data.settings) {
      await this.saveSettings(data.settings);
    }

    if (Array.isArray(data.reminders)) {
      if (!isChromeStorageAvailable()) {
        mockStorage[STORAGE_KEYS.REMINDERS] = data.reminders;
      } else {
        await new Promise((resolve) => {
          chrome.storage.local.set({ [STORAGE_KEYS.REMINDERS]: data.reminders }, resolve);
        });
      }
    }

    return {
      success: true,
      importedCount: data.reminders ? data.reminders.length : 0,
    };
  }
}
