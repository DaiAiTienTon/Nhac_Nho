import assert from 'assert';
import { ReminderManager } from '../src/background/reminder-manager.js';
import { AlarmManager } from '../src/background/alarm-manager.js';
import { AudioManager } from '../src/background/audio-manager.js';
import { NotificationManager } from '../src/background/notification-manager.js';
import { StorageManager } from '../src/storage/storage-manager.js';
import { SCHEDULE_TYPES, SOUND_IDS } from '../src/utils/constants.js';

export async function runReminderManagerTests() {
  console.log('--- Testing Reminder Manager ---');

  await StorageManager.resetAll();

  let notificationShown = false;
  let audioPlayed = false;

  const mockAlarmManager = new AlarmManager();
  const mockNotificationManager = new NotificationManager();
  mockNotificationManager.showNotification = async (rem, settings) => {
    notificationShown = true;
    return 'mock_notif_id';
  };

  const mockAudioManager = new AudioManager();
  mockAudioManager.playSound = async (soundId, vol) => {
    audioPlayed = true;
    return true;
  };

  const reminderManager = new ReminderManager(mockAlarmManager, mockNotificationManager, mockAudioManager);

  // 1. Create reminder
  const createRes = await reminderManager.createReminder({
    title: 'Uống nước định kỳ',
    message: 'Nạp năng lượng nào!',
    enabled: true,
    schedule: {
      type: SCHEDULE_TYPES.INTERVAL,
      intervalMinutes: 30,
    },
    sound: { enabled: true, soundId: SOUND_IDS.DEFAULT },
  });

  assert.strictEqual(createRes.success, true);
  assert.ok(createRes.reminder.id);
  assert.ok(createRes.reminder.nextTriggerAt > Date.now());
  console.log('✓ Reminder created with nextTriggerAt and alarm scheduled');

  // 2. Trigger alarm & verify notifications/audio
  notificationShown = false;
  audioPlayed = false;

  await reminderManager.handleAlarmTriggered(createRes.reminder.id);
  assert.strictEqual(notificationShown, true);
  assert.strictEqual(audioPlayed, true);

  // Since it is recurring interval, it should be rescheduled
  const updatedRem = await StorageManager.getReminderById(createRes.reminder.id);
  assert.strictEqual(updatedRem.enabled, true);
  assert.ok(updatedRem.nextTriggerAt > Date.now());
  console.log('✓ Triggered recurring reminder properly invoked notifications/audio and rescheduled');

  // 3. One-time trigger disabled after fire
  const oneTimeRes = await reminderManager.createReminder({
    title: 'Họp với khách hàng',
    schedule: {
      type: SCHEDULE_TYPES.ONE_TIME,
      date: '2026-08-19',
      time: '23:59',
    },
  });

  await reminderManager.handleAlarmTriggered(oneTimeRes.reminder.id);
  const updatedOneTime = await StorageManager.getReminderById(oneTimeRes.reminder.id);
  assert.strictEqual(updatedOneTime.enabled, false);
  assert.strictEqual(updatedOneTime.nextTriggerAt, 0);
  console.log('✓ One-time reminder auto-disabled after firing');

  // 4. Next active reminder calculation
  const nextActive = await reminderManager.getNextActiveReminder();
  assert.ok(nextActive);
  assert.strictEqual(nextActive.id, createRes.reminder.id);
  console.log('✓ getNextActiveReminder correctly found upcoming reminder');
}
