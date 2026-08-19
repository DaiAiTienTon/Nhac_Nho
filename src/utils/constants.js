/**
 * Constants and Configuration for Event Reminder Extension
 */

export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  REMINDERS: 'reminders',
};

export const SCHEDULE_TYPES = {
  ONE_TIME: 'one_time',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  INTERVAL: 'interval',
};

export const SOUND_IDS = {
  NONE: 'none',
  DEFAULT: 'default',
  SOFT: 'soft',
  BELL: 'bell',
};

export const SOUND_FILES = {
  [SOUND_IDS.DEFAULT]: 'assets/sounds/default.wav',
  [SOUND_IDS.SOFT]: 'assets/sounds/soft.wav',
  [SOUND_IDS.BELL]: 'assets/sounds/bell.wav',
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
};

export const DEFAULT_SETTINGS = {
  enabled: true,
  notifications: {
    enabled: true,
    priority: NOTIFICATION_PRIORITIES.NORMAL,
  },
  audio: {
    enabled: true,
    volume: 0.8,
    defaultSound: SOUND_IDS.DEFAULT,
  },
};

export const ALARM_PREFIX = 'reminder_';

export const DAYS_OF_WEEK = [
  { value: 1, label: 'T2', fullLabel: 'Thứ Hai', shortName: 'Mon' },
  { value: 2, label: 'T3', fullLabel: 'Thứ Ba', shortName: 'Tue' },
  { value: 3, label: 'T4', fullLabel: 'Thứ Tư', shortName: 'Wed' },
  { value: 4, label: 'T5', fullLabel: 'Thứ Năm', shortName: 'Thu' },
  { value: 5, label: 'T6', fullLabel: 'Thứ Sáu', shortName: 'Fri' },
  { value: 6, label: 'T7', fullLabel: 'Thứ Bảy', shortName: 'Sat' },
  { value: 0, label: 'CN', fullLabel: 'Chủ Nhật', shortName: 'Sun' },
];

export const MESSAGE_TYPES = {
  PLAY_SOUND: 'PLAY_SOUND',
  STOP_SOUND: 'STOP_SOUND',
  TEST_SOUND: 'TEST_SOUND',
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',
  GET_REMINDERS: 'GET_REMINDERS',
  SAVE_REMINDER: 'SAVE_REMINDER',
  DELETE_REMINDER: 'DELETE_REMINDER',
  TOGGLE_REMINDER: 'TOGGLE_REMINDER',
  SNOOZE_REMINDER: 'SNOOZE_REMINDER',
  ACKNOWLEDGE_REMINDER: 'ACKNOWLEDGE_REMINDER',
  SYNC_ALARMS: 'SYNC_ALARMS',
  REMINDERS_UPDATED: 'REMINDERS_UPDATED',
};
