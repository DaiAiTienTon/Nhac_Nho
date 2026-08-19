import assert from 'assert';
import {
  calculateNextTriggerAt,
  formatTime,
  formatDate,
  formatFriendlyDateTime,
  getScheduleSummary,
  getTimeRemaining,
} from '../src/utils/date-utils.js';
import { SCHEDULE_TYPES } from '../src/utils/constants.js';

export function runDateUtilsTests() {
  console.log('--- Testing Date Utils ---');

  // Test 1: Daily schedule calculation
  const baseTime = new Date('2026-08-19T07:00:00').getTime(); // 7:00 AM
  const dailySchedule = { type: SCHEDULE_TYPES.DAILY, time: '08:30' };
  const nextDaily = calculateNextTriggerAt(dailySchedule, baseTime);
  const nextDailyDate = new Date(nextDaily);
  assert.strictEqual(nextDailyDate.getHours(), 8);
  assert.strictEqual(nextDailyDate.getMinutes(), 30);
  assert.strictEqual(nextDailyDate.getDate(), 19);
  console.log('✓ Daily future time calculated for today');

  // Test 2: Daily schedule when time has passed today (rolls to tomorrow)
  const baseTimePassed = new Date('2026-08-19T10:00:00').getTime(); // 10:00 AM
  const nextDailyTomorrow = calculateNextTriggerAt(dailySchedule, baseTimePassed);
  const nextDailyTomorrowDate = new Date(nextDailyTomorrow);
  assert.strictEqual(nextDailyTomorrowDate.getHours(), 8);
  assert.strictEqual(nextDailyTomorrowDate.getMinutes(), 30);
  assert.strictEqual(nextDailyTomorrowDate.getDate(), 20);
  console.log('✓ Daily passed time rolled to tomorrow');

  // Test 3: Weekly schedule
  // 2026-08-19 is a Wednesday (day 3)
  const wednesdayBase = new Date('2026-08-19T07:00:00').getTime();
  const weeklySchedule = {
    type: SCHEDULE_TYPES.WEEKLY,
    time: '09:00',
    days: [3, 5], // Wednesday & Friday
  };
  const nextWeekly = calculateNextTriggerAt(weeklySchedule, wednesdayBase);
  const nextWeeklyDate = new Date(nextWeekly);
  assert.strictEqual(nextWeeklyDate.getDay(), 3); // Today is Wed and 9:00 is in the future
  assert.strictEqual(nextWeeklyDate.getDate(), 19);

  // If Wed 9:00 has passed, next is Fri (day 5)
  const wednesdayPassed = new Date('2026-08-19T10:00:00').getTime();
  const nextWeeklyFri = calculateNextTriggerAt(weeklySchedule, wednesdayPassed);
  const nextWeeklyFriDate = new Date(nextWeeklyFri);
  assert.strictEqual(nextWeeklyFriDate.getDay(), 5); // Friday
  assert.strictEqual(nextWeeklyFriDate.getDate(), 21);
  console.log('✓ Weekly schedule correctly handles same-day future and multi-day jumps');

  // Test 4: Interval schedule
  const intervalSchedule = { type: SCHEDULE_TYPES.INTERVAL, intervalMinutes: 45 };
  const nextInterval = calculateNextTriggerAt(intervalSchedule, baseTime);
  assert.strictEqual(nextInterval, baseTime + 45 * 60 * 1000);
  console.log('✓ Interval schedule calculated accurately');

  // Test 5: One-time schedule
  const oneTimeSchedule = { type: SCHEDULE_TYPES.ONE_TIME, date: '2026-08-19', time: '14:00' };
  const nextOneTime = calculateNextTriggerAt(oneTimeSchedule, baseTime);
  const nextOneTimeDate = new Date(nextOneTime);
  assert.strictEqual(nextOneTimeDate.getDate(), 19);
  assert.strictEqual(nextOneTimeDate.getHours(), 14);

  // One time in the past should return 0
  const pastOneTime = calculateNextTriggerAt(oneTimeSchedule, new Date('2026-08-19T15:00:00').getTime());
  assert.strictEqual(pastOneTime, 0);
  console.log('✓ One-time schedule handles future and expired cases');

  // Test 6: Formatting helpers
  assert.strictEqual(formatTime(new Date('2026-08-19T08:05:00')), '08:05');
  assert.strictEqual(formatDate(new Date('2026-08-19T08:05:00')), '2026-08-19');
  assert.ok(getScheduleSummary(dailySchedule).includes('08:30'));
  assert.ok(getScheduleSummary(intervalSchedule).includes('45 phút'));
  console.log('✓ Formatting helpers work correctly');
}
