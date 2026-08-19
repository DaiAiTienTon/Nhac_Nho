/**
 * Validation utilities for Reminders and Settings
 */

import { SCHEDULE_TYPES, SOUND_IDS, NOTIFICATION_PRIORITIES } from './constants.js';

/**
 * Validates a reminder object.
 * @param {Object} reminder
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateReminder(reminder) {
  if (!reminder || typeof reminder !== 'object') {
    return { isValid: false, error: 'Dữ liệu lời nhắc không hợp lệ.' };
  }

  // Title validation
  if (!reminder.title || typeof reminder.title !== 'string' || reminder.title.trim().length === 0) {
    return { isValid: false, error: 'Tiêu đề sự kiện không được để trống.' };
  }
  if (reminder.title.trim().length > 100) {
    return { isValid: false, error: 'Tiêu đề sự kiện tối đa 100 ký tự.' };
  }

  // Message validation
  if (reminder.message && typeof reminder.message !== 'string') {
    return { isValid: false, error: 'Nội dung nhắc nhở không hợp lệ.' };
  }
  if (reminder.message && reminder.message.length > 500) {
    return { isValid: false, error: 'Nội dung nhắc nhở tối đa 500 ký tự.' };
  }

  // Schedule validation
  const schedule = reminder.schedule;
  if (!schedule || typeof schedule !== 'object' || !schedule.type) {
    return { isValid: false, error: 'Kiểu lịch trình không hợp lệ.' };
  }

  const validTypes = Object.values(SCHEDULE_TYPES);
  if (!validTypes.includes(schedule.type)) {
    return { isValid: false, error: `Kiểu lịch trình '${schedule.type}' không được hỗ trợ.` };
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  switch (schedule.type) {
    case SCHEDULE_TYPES.ONE_TIME: {
      if (!schedule.date || !dateRegex.test(schedule.date)) {
        return { isValid: false, error: 'Ngày diễn ra không hợp lệ (YYYY-MM-DD).' };
      }
      if (!schedule.time || !timeRegex.test(schedule.time)) {
        return { isValid: false, error: 'Giờ nhắc nhở không hợp lệ (HH:mm).' };
      }
      break;
    }

    case SCHEDULE_TYPES.DAILY: {
      if (!schedule.time || !timeRegex.test(schedule.time)) {
        return { isValid: false, error: 'Giờ nhắc nhở không hợp lệ (HH:mm).' };
      }
      break;
    }

    case SCHEDULE_TYPES.WEEKLY: {
      if (!schedule.time || !timeRegex.test(schedule.time)) {
        return { isValid: false, error: 'Giờ nhắc nhở không hợp lệ (HH:mm).' };
      }
      if (!Array.isArray(schedule.days) || schedule.days.length === 0) {
        return { isValid: false, error: 'Vui lòng chọn ít nhất một ngày trong tuần.' };
      }
      const invalidDay = schedule.days.some(d => typeof d !== 'number' || d < 0 || d > 6);
      if (invalidDay) {
        return { isValid: false, error: 'Ngày trong tuần không hợp lệ (0-6).' };
      }
      break;
    }

    case SCHEDULE_TYPES.INTERVAL: {
      const minutes = Number(schedule.intervalMinutes);
      if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
        return { isValid: false, error: 'Khoảng thời gian định kỳ phải từ 1 đến 1440 phút (24 giờ).' };
      }
      break;
    }
  }

  // Sound config validation
  if (reminder.sound) {
    if (typeof reminder.sound.enabled !== 'boolean') {
      return { isValid: false, error: 'Trạng thái âm thanh không hợp lệ.' };
    }
    if (reminder.sound.soundId && !Object.values(SOUND_IDS).includes(reminder.sound.soundId)) {
      return { isValid: false, error: 'Loại âm thanh không hợp lệ.' };
    }
  }

  return { isValid: true };
}

/**
 * Validates settings object.
 * @param {Object} settings
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { isValid: false, error: 'Dữ liệu cài đặt không hợp lệ.' };
  }

  if (typeof settings.enabled !== 'boolean') {
    return { isValid: false, error: 'Trạng thái hoạt động chung phải là boolean.' };
  }

  if (settings.notifications) {
    if (typeof settings.notifications.enabled !== 'boolean') {
      return { isValid: false, error: 'Cài đặt thông báo không hợp lệ.' };
    }
    if (
      settings.notifications.priority &&
      !Object.values(NOTIFICATION_PRIORITIES).includes(settings.notifications.priority)
    ) {
      return { isValid: false, error: 'Độ ưu tiên thông báo không hợp lệ.' };
    }
  }

  if (settings.audio) {
    if (typeof settings.audio.enabled !== 'boolean') {
      return { isValid: false, error: 'Cài đặt âm thanh không hợp lệ.' };
    }
    if (
      typeof settings.audio.volume !== 'number' ||
      settings.audio.volume < 0 ||
      settings.audio.volume > 1
    ) {
      return { isValid: false, error: 'Âm lượng phải là số từ 0.0 đến 1.0.' };
    }
    if (
      settings.audio.defaultSound &&
      !Object.values(SOUND_IDS).includes(settings.audio.defaultSound)
    ) {
      return { isValid: false, error: 'Âm thanh mặc định không hợp lệ.' };
    }
  }

  return { isValid: true };
}

/**
 * Validates import JSON data schema
 * @param {Object} data
 * @returns {{ isValid: boolean, error?: string, sanitizedData?: Object }}
 */
export function validateImportData(data) {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'File dữ liệu không đúng định dạng JSON.' };
  }

  if (!Array.isArray(data.reminders)) {
    return { isValid: false, error: 'File import không chứa danh sách reminders hợp lệ.' };
  }

  for (let i = 0; i < data.reminders.length; i++) {
    const item = data.reminders[i];
    const validation = validateReminder(item);
    if (!validation.isValid) {
      return { isValid: false, error: `Lời nhắc số ${i + 1} (${item.title || 'không tên'}): ${validation.error}` };
    }
  }

  if (data.settings) {
    const settingsVal = validateSettings(data.settings);
    if (!settingsVal.isValid) {
      return { isValid: false, error: `Cài đặt: ${settingsVal.error}` };
    }
  }

  return { isValid: true };
}
