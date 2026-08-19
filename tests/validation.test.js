import assert from 'assert';
import { validateReminder, validateSettings, validateImportData } from '../src/utils/validation.js';
import { SCHEDULE_TYPES, SOUND_IDS, NOTIFICATION_PRIORITIES } from '../src/utils/constants.js';

export function runValidationTests() {
  console.log('--- Testing Validation Utils ---');

  // 1. Valid Reminder
  const validReminder = {
    title: 'Học bài và làm bài tập',
    message: 'Tập trung 45 phút',
    schedule: {
      type: SCHEDULE_TYPES.DAILY,
      time: '08:00',
    },
    sound: {
      enabled: true,
      soundId: SOUND_IDS.DEFAULT,
    },
  };
  assert.strictEqual(validateReminder(validReminder).isValid, true);
  console.log('✓ Valid reminder accepted');

  // 2. Empty Title
  const invalidTitle = { ...validReminder, title: '   ' };
  assert.strictEqual(validateReminder(invalidTitle).isValid, false);
  console.log('✓ Empty title rejected');

  // 3. Invalid Schedule type
  const invalidType = { ...validReminder, schedule: { type: 'invalid_type' } };
  assert.strictEqual(validateReminder(invalidType).isValid, false);
  console.log('✓ Invalid schedule type rejected');

  // 4. Invalid Weekly (empty days)
  const invalidWeekly = {
    ...validReminder,
    schedule: { type: SCHEDULE_TYPES.WEEKLY, time: '08:00', days: [] },
  };
  assert.strictEqual(validateReminder(invalidWeekly).isValid, false);
  console.log('✓ Weekly schedule without days rejected');

  // 5. Invalid Interval (negative or zero)
  const invalidInterval = {
    ...validReminder,
    schedule: { type: SCHEDULE_TYPES.INTERVAL, intervalMinutes: 0 },
  };
  assert.strictEqual(validateReminder(invalidInterval).isValid, false);
  console.log('✓ Invalid interval <= 0 rejected');

  // 6. Settings Validation
  const validSettings = {
    enabled: true,
    notifications: { enabled: true, priority: NOTIFICATION_PRIORITIES.NORMAL },
    audio: { enabled: true, volume: 0.8, defaultSound: SOUND_IDS.DEFAULT },
  };
  assert.strictEqual(validateSettings(validSettings).isValid, true);

  const invalidVol = {
    ...validSettings,
    audio: { ...validSettings.audio, volume: 1.5 },
  };
  assert.strictEqual(validateSettings(invalidVol).isValid, false);
  console.log('✓ Settings volume validation works');

  // 7. Import Validation
  const validImport = {
    version: 1,
    settings: validSettings,
    reminders: [validReminder],
  };
  assert.strictEqual(validateImportData(validImport).isValid, true);
  console.log('✓ Valid import data accepted');
}
