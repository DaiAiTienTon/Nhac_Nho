import assert from 'assert';
import { StorageManager } from '../src/storage/storage-manager.js';
import { SCHEDULE_TYPES, SOUND_IDS } from '../src/utils/constants.js';

export async function runStorageTests() {
  console.log('--- Testing Storage Manager ---');

  await StorageManager.resetAll();

  // 1. Initial settings
  const settings = await StorageManager.getSettings();
  assert.strictEqual(settings.enabled, true);
  assert.strictEqual(settings.audio.defaultSound, SOUND_IDS.DEFAULT);
  console.log('✓ Default settings loaded properly');

  // 2. Save settings
  const updatedRes = await StorageManager.saveSettings({
    enabled: false,
    audio: { volume: 0.5 },
  });
  assert.strictEqual(updatedRes.success, true);
  const updatedSettings = await StorageManager.getSettings();
  assert.strictEqual(updatedSettings.enabled, false);
  assert.strictEqual(updatedSettings.audio.volume, 0.5);
  console.log('✓ Settings updated and merged properly');

  // 3. Save & retrieve reminder
  const testReminder = {
    id: 'test_rem_1',
    title: 'Họp team buổi sáng',
    message: 'Review tiến độ tuần',
    enabled: true,
    schedule: {
      type: SCHEDULE_TYPES.DAILY,
      time: '09:00',
    },
    notification: { enabled: true },
    sound: { enabled: true, soundId: SOUND_IDS.DEFAULT },
  };

  const saveRes = await StorageManager.saveReminder(testReminder);
  assert.strictEqual(saveRes.success, true);

  const reminders = await StorageManager.getReminders();
  assert.strictEqual(reminders.length, 1);
  assert.strictEqual(reminders[0].title, 'Họp team buổi sáng');
  console.log('✓ Reminder saved and retrieved');

  // 4. Toggle reminder
  await StorageManager.toggleReminder('test_rem_1', false);
  const toggled = await StorageManager.getReminderById('test_rem_1');
  assert.strictEqual(toggled.enabled, false);
  console.log('✓ Reminder toggle works');

  // 5. Export & Import
  const exported = await StorageManager.exportData();
  assert.strictEqual(exported.reminders.length, 1);

  await StorageManager.resetAll();
  assert.strictEqual((await StorageManager.getReminders()).length, 0);

  const importRes = await StorageManager.importData(exported);
  assert.strictEqual(importRes.success, true);
  assert.strictEqual((await StorageManager.getReminders()).length, 1);
  console.log('✓ Export and Import works end-to-end');

  // 6. Delete
  await StorageManager.deleteReminder('test_rem_1');
  assert.strictEqual((await StorageManager.getReminders()).length, 0);
  console.log('✓ Reminder deletion works');
}
