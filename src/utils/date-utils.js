/**
 * Date and Scheduling Utility Functions
 * Handles all timezone-aware local calculations for event reminders.
 */

import { SCHEDULE_TYPES, DAYS_OF_WEEK } from './constants.js';

/**
 * Calculates the next trigger timestamp (milliseconds from epoch) for a reminder.
 * 
 * @param {Object} schedule - The reminder schedule configuration
 * @param {number} [baseTime=Date.now()] - Reference timestamp for calculation
 * @returns {number} Next trigger epoch timestamp in ms (or 0 if one-time and passed)
 */
export function calculateNextTriggerAt(schedule, baseTime = Date.now()) {
  if (!schedule || !schedule.type) {
    return 0;
  }

  const baseDate = new Date(baseTime);

  switch (schedule.type) {
    case SCHEDULE_TYPES.ONE_TIME: {
      if (!schedule.date || !schedule.time) return 0;
      const [year, month, day] = schedule.date.split('-').map(Number);
      const [hours, minutes] = schedule.time.split(':').map(Number);
      
      const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const targetTime = targetDate.getTime();
      return targetTime > baseTime ? targetTime : 0;
    }

    case SCHEDULE_TYPES.DAILY: {
      if (!schedule.time) return 0;
      const [hours, minutes] = schedule.time.split(':').map(Number);
      
      const targetDate = new Date(baseDate);
      targetDate.setHours(hours, minutes, 0, 0);

      // If time has already passed today, advance to tomorrow
      if (targetDate.getTime() <= baseTime) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      return targetDate.getTime();
    }

    case SCHEDULE_TYPES.WEEKLY: {
      if (!schedule.time || !Array.isArray(schedule.days) || schedule.days.length === 0) {
        return 0;
      }
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const currentDay = baseDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      let minNextTime = Infinity;

      // Check next occurrence for all selected weekdays (within the next 7 days)
      for (const targetDay of schedule.days) {
        const candidate = new Date(baseDate);
        let daysOffset = (targetDay - currentDay + 7) % 7;
        candidate.setDate(candidate.getDate() + daysOffset);
        candidate.setHours(hours, minutes, 0, 0);

        // If it falls on today but the time has passed, jump to next week
        if (candidate.getTime() <= baseTime) {
          candidate.setDate(candidate.getDate() + 7);
        }

        if (candidate.getTime() < minNextTime) {
          minNextTime = candidate.getTime();
        }
      }

      return minNextTime === Infinity ? 0 : minNextTime;
    }

    case SCHEDULE_TYPES.INTERVAL: {
      const minutes = Number(schedule.intervalMinutes);
      if (!minutes || minutes <= 0) return 0;
      return baseTime + minutes * 60 * 1000;
    }

    default:
      return 0;
  }
}

/**
 * Formats a Date or timestamp to HH:mm (24h)
 * @param {Date|number} dateOrMs
 * @returns {string}
 */
export function formatTime(dateOrMs) {
  if (!dateOrMs) return '--:--';
  const d = new Date(dateOrMs);
  if (isNaN(d.getTime())) return '--:--';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats a Date or timestamp to YYYY-MM-DD
 * @param {Date|number} dateOrMs
 * @returns {string}
 */
export function formatDate(dateOrMs) {
  if (!dateOrMs) return '';
  const d = new Date(dateOrMs);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a timestamp to a friendly Vietnamese / localized date-time string
 * @param {number} timestamp
 * @returns {string}
 */
export function formatFriendlyDateTime(timestamp) {
  if (!timestamp) return 'Chưa có lịch';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Không xác định';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = formatTime(date);

  if (isToday) {
    return `Hôm nay, lúc ${timeStr}`;
  } else if (isTomorrow) {
    return `Ngày mai, lúc ${timeStr}`;
  } else {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}, lúc ${timeStr}`;
  }
}

/**
 * Returns human-readable summary of a schedule
 * @param {Object} schedule
 * @returns {string}
 */
export function getScheduleSummary(schedule) {
  if (!schedule) return 'Chưa đặt lịch';

  switch (schedule.type) {
    case SCHEDULE_TYPES.ONE_TIME: {
      if (!schedule.date || !schedule.time) return 'Một lần';
      const [y, m, d] = schedule.date.split('-');
      return `Một lần (${d}/${m} lúc ${schedule.time})`;
    }
    case SCHEDULE_TYPES.DAILY:
      return `Hàng ngày lúc ${schedule.time || '--:--'}`;

    case SCHEDULE_TYPES.WEEKLY: {
      if (!Array.isArray(schedule.days) || schedule.days.length === 0) {
        return `Hàng tuần lúc ${schedule.time || '--:--'}`;
      }
      if (schedule.days.length === 7) {
        return `Mỗi ngày lúc ${schedule.time}`;
      }
      const dayLabels = schedule.days
        .map(d => DAYS_OF_WEEK.find(item => item.value === d)?.label || `T${d}`)
        .join(', ');
      return `Thứ [${dayLabels}] lúc ${schedule.time}`;
    }

    case SCHEDULE_TYPES.INTERVAL:
      return `Lặp lại mỗi ${schedule.intervalMinutes} phút`;

    default:
      return 'Tùy chỉnh';
  }
}

/**
 * Returns human-readable countdown string (e.g. "Còn 25 phút", "Còn 2 giờ 10 phút")
 * @param {number} targetTimestamp
 * @param {number} [fromTime=Date.now()]
 * @returns {string}
 */
export function getTimeRemaining(targetTimestamp, fromTime = Date.now()) {
  if (!targetTimestamp || targetTimestamp <= fromTime) {
    return 'Đến giờ';
  }
  const diffMs = targetTimestamp - fromTime;
  const diffMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return `Còn ${days} ngày ${remHours > 0 ? remHours + ' giờ' : ''}`.trim();
  }
  if (hours > 0) {
    return `Còn ${hours} giờ ${minutes > 0 ? minutes + ' phút' : ''}`.trim();
  }
  if (minutes > 0) {
    return `Còn ${minutes} phút`;
  }
  return 'Dưới 1 phút';
}
