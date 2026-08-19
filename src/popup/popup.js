/**
 * Popup Controller Script
 */

import { StorageManager } from '../storage/storage-manager.js';
import { calculateNextTriggerAt, formatTime, formatDate, formatFriendlyDateTime, getScheduleSummary, getTimeRemaining } from '../utils/date-utils.js';
import { SCHEDULE_TYPES, SOUND_IDS, MESSAGE_TYPES } from '../utils/constants.js';

// State
let allReminders = [];
let nextReminder = null;
let currentFilter = 'all';
let selectedWeekdays = [1, 2, 3, 4, 5];
let tickerInterval = null;

// DOM Elements
const elRemindersList = document.getElementById('reminders-list');
const elEmptyState = document.getElementById('empty-state');
const elNextCountdown = document.getElementById('next-countdown');
const elNextTitle = document.getElementById('next-title');
const elNextMeta = document.getElementById('next-meta');

const elCountAll = document.getElementById('count-all');
const elCountToday = document.getElementById('count-today');
const elCountActive = document.getElementById('count-active');

const btnOpenOptions = document.getElementById('btn-open-options');
const btnShowAdd = document.getElementById('btn-show-add');

// Modal Elements
const modalOverlay = document.getElementById('reminder-modal');
const modalHeading = document.getElementById('modal-heading');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelForm = document.getElementById('btn-cancel-form');
const reminderForm = document.getElementById('reminder-form');
const formErrorMsg = document.getElementById('form-error-msg');

const formId = document.getElementById('form-reminder-id');
const formTitle = document.getElementById('form-title');
const formMessage = document.getElementById('form-message');
const formDate = document.getElementById('form-date');
const formTime = document.getElementById('form-time');
const formInterval = document.getElementById('form-interval');
const formSound = document.getElementById('form-sound');
const btnPopupTestSound = document.getElementById('btn-popup-test-sound');

const fieldDateWrap = document.getElementById('field-date-wrap');
const fieldTimeWrap = document.getElementById('field-time-wrap');
const fieldDaysWrap = document.getElementById('field-days-wrap');
const fieldIntervalWrap = document.getElementById('field-interval-wrap');

/**
 * Initializes Popup
 */
async function initPopup() {
  await loadData();
  setupEventListeners();
  startCountdownTicker();
}

/**
 * Fetches reminders and next upcoming event from background service worker
 */
async function loadData() {
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_REMINDERS }, (response) => {
    if (response?.success) {
      allReminders = response.reminders || [];
      nextReminder = response.nextReminder || null;
    } else {
      // Fallback direct storage read
      StorageManager.getReminders().then((rems) => {
        allReminders = rems || [];
        updateUI();
      });
      return;
    }
    updateUI();
  });
}

/**
 * Renders full UI based on state
 */
function updateUI() {
  updateCounts();
  renderNextReminderBanner();
  renderRemindersList();
}

/**
 * Updates filter counts
 */
function updateCounts() {
  const now = new Date();
  const todayDateStr = formatDate(now);
  const currentDay = now.getDay();

  const todayCount = allReminders.filter((r) => {
    if (!r.enabled) return false;
    if (r.schedule.type === SCHEDULE_TYPES.DAILY || r.schedule.type === SCHEDULE_TYPES.INTERVAL) return true;
    if (r.schedule.type === SCHEDULE_TYPES.ONE_TIME && r.schedule.date === todayDateStr) return true;
    if (r.schedule.type === SCHEDULE_TYPES.WEEKLY && Array.isArray(r.schedule.days) && r.schedule.days.includes(currentDay)) return true;
    return false;
  }).length;

  const activeCount = allReminders.filter((r) => r.enabled).length;

  elCountAll.textContent = allReminders.length;
  elCountToday.textContent = todayCount;
  elCountActive.textContent = activeCount;
}

/**
 * Renders the top Hero Next Reminder card
 */
function renderNextReminderBanner() {
  if (!nextReminder || !nextReminder.enabled || nextReminder.nextTriggerAt <= Date.now()) {
    // Look in memory if not provided
    const active = allReminders.filter((r) => r.enabled && r.nextTriggerAt > Date.now());
    active.sort((a, b) => a.nextTriggerAt - b.nextTriggerAt);
    nextReminder = active[0] || null;
  }

  if (nextReminder && nextReminder.nextTriggerAt > Date.now()) {
    elNextCountdown.textContent = getTimeRemaining(nextReminder.nextTriggerAt);
    elNextTitle.textContent = nextReminder.title;
    elNextMeta.textContent = `${formatFriendlyDateTime(nextReminder.nextTriggerAt)} • ${getScheduleSummary(nextReminder.schedule)}`;
  } else {
    elNextCountdown.textContent = 'Trống';
    elNextTitle.textContent = 'Chưa có sự kiện sắp tới';
    elNextMeta.textContent = 'Tạo lời nhắc để không bỏ lỡ sự kiện quan trọng';
  }
}

/**
 * Renders the list of reminder cards according to current filter
 */
function renderRemindersList() {
  const now = new Date();
  const todayDateStr = formatDate(now);
  const currentDay = now.getDay();

  let filtered = [...allReminders];

  if (currentFilter === 'today') {
    filtered = filtered.filter((r) => {
      if (r.schedule.type === SCHEDULE_TYPES.DAILY || r.schedule.type === SCHEDULE_TYPES.INTERVAL) return true;
      if (r.schedule.type === SCHEDULE_TYPES.ONE_TIME && r.schedule.date === todayDateStr) return true;
      if (r.schedule.type === SCHEDULE_TYPES.WEEKLY && Array.isArray(r.schedule.days) && r.schedule.days.includes(currentDay)) return true;
      return false;
    });
  } else if (currentFilter === 'active') {
    filtered = filtered.filter((r) => r.enabled);
  }

  // Sort by nextTriggerAt or creation time
  filtered.sort((a, b) => {
    if (a.enabled && !b.enabled) return -1;
    if (!a.enabled && b.enabled) return 1;
    if (a.nextTriggerAt && b.nextTriggerAt) return a.nextTriggerAt - b.nextTriggerAt;
    return b.createdAt - a.createdAt;
  });

  elRemindersList.innerHTML = '';

  if (filtered.length === 0) {
    elEmptyState.style.display = 'flex';
    return;
  }

  elEmptyState.style.display = 'none';

  filtered.forEach((reminder) => {
    const card = document.createElement('div');
    card.className = `reminder-card-shell ${reminder.enabled ? '' : 'disabled'}`;
    card.dataset.id = reminder.id;

    const timeDisplay = reminder.schedule.time || (reminder.schedule.type === SCHEDULE_TYPES.INTERVAL ? `Mỗi ${reminder.schedule.intervalMinutes}p` : '--:--');

    card.innerHTML = `
      <div class="reminder-card-core">
        <div class="card-top-row">
          <div>
            <span class="time-badge">${escapeHtml(timeDisplay)}</span>
            <h4 class="reminder-title">${escapeHtml(reminder.title)}</h4>
            ${reminder.message ? `<p class="reminder-message">${escapeHtml(reminder.message)}</p>` : ''}
          </div>
          <label class="mini-toggle" title="${reminder.enabled ? 'Đang bật' : 'Đã tắt'}">
            <input type="checkbox" class="toggle-status" data-id="${reminder.id}" ${reminder.enabled ? 'checked' : ''}>
            <span class="mini-slider"></span>
          </label>
        </div>
        <div class="card-meta-row">
          <div class="meta-badges">
            <span class="type-pill">${getScheduleSummary(reminder.schedule)}</span>
            ${reminder.sound?.enabled && reminder.sound?.soundId !== SOUND_IDS.NONE ? `
              <span class="sound-indicator-icon" title="Có chuông báo">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              </span>
            ` : ''}
          </div>
          <div class="card-controls">
            <button type="button" class="mini-action-btn btn-edit" data-id="${reminder.id}" title="Chỉnh sửa">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button type="button" class="mini-action-btn btn-del" data-id="${reminder.id}" title="Xóa">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    elRemindersList.appendChild(card);
  });
}

/**
 * Opens modal to create a new reminder or edit an existing one
 */
function openModal(reminder = null) {
  formErrorMsg.style.display = 'none';
  reminderForm.reset();

  if (reminder) {
    modalHeading.textContent = 'Chỉnh Sửa Lời Nhắc';
    formId.value = reminder.id;
    formTitle.value = reminder.title;
    formMessage.value = reminder.message || '';
    
    // Set schedule type
    const typeRadio = document.querySelector(`input[name="schedule_type"][value="${reminder.schedule.type}"]`);
    if (typeRadio) typeRadio.checked = true;

    formDate.value = reminder.schedule.date || formatDate(new Date());
    formTime.value = reminder.schedule.time || '08:00';
    formInterval.value = reminder.schedule.intervalMinutes || 45;
    selectedWeekdays = Array.isArray(reminder.schedule.days) ? [...reminder.schedule.days] : [1, 2, 3, 4, 5];

    formSound.value = reminder.sound?.soundId || SOUND_IDS.DEFAULT;
  } else {
    modalHeading.textContent = 'Tạo Lời Nhắc Sự Kiện';
    formId.value = '';
    const now = new Date();
    formDate.value = formatDate(now);
    
    // Suggest current time + 1 hour
    const future = new Date(now.getTime() + 60 * 60 * 1000);
    formTime.value = formatTime(future);
    formInterval.value = 45;
    selectedWeekdays = [1, 2, 3, 4, 5];
    formSound.value = SOUND_IDS.DEFAULT;

    document.querySelector('input[name="schedule_type"][value="daily"]').checked = true;
  }

  updateScheduleFieldsVisibility();
  updateWeekdayPillsUI();
  modalOverlay.style.display = 'flex';
  formTitle.focus();
}

/**
 * Closes modal form
 */
function closeModal() {
  modalOverlay.style.display = 'none';
}

/**
 * Updates field visibility based on selected schedule type radio
 */
function updateScheduleFieldsVisibility() {
  const selectedType = document.querySelector('input[name="schedule_type"]:checked')?.value || 'daily';

  fieldDateWrap.style.display = selectedType === SCHEDULE_TYPES.ONE_TIME ? 'flex' : 'none';
  fieldTimeWrap.style.display = selectedType !== SCHEDULE_TYPES.INTERVAL ? 'flex' : 'none';
  fieldDaysWrap.style.display = selectedType === SCHEDULE_TYPES.WEEKLY ? 'flex' : 'none';
  fieldIntervalWrap.style.display = selectedType === SCHEDULE_TYPES.INTERVAL ? 'flex' : 'none';
}

/**
 * Updates UI for weekday selection pills
 */
function updateWeekdayPillsUI() {
  document.querySelectorAll('.day-pill').forEach((pill) => {
    const day = Number(pill.dataset.day);
    if (selectedWeekdays.includes(day)) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

/**
 * Handles Form Submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  formErrorMsg.style.display = 'none';

  const type = document.querySelector('input[name="schedule_type"]:checked')?.value;
  const title = formTitle.value.trim();
  const message = formMessage.value.trim();
  const soundId = formSound.value;

  if (!title) {
    showFormError('Vui lòng nhập tên sự kiện / lời nhắc.');
    return;
  }

  const schedule = { type };

  if (type === SCHEDULE_TYPES.ONE_TIME) {
    if (!formDate.value || !formTime.value) {
      showFormError('Vui lòng chọn ngày và giờ diễn ra.');
      return;
    }
    schedule.date = formDate.value;
    schedule.time = formTime.value;
  } else if (type === SCHEDULE_TYPES.DAILY) {
    if (!formTime.value) {
      showFormError('Vui lòng chọn giờ nhắc nhở.');
      return;
    }
    schedule.time = formTime.value;
  } else if (type === SCHEDULE_TYPES.WEEKLY) {
    if (!formTime.value) {
      showFormError('Vui lòng chọn giờ nhắc nhở.');
      return;
    }
    if (selectedWeekdays.length === 0) {
      showFormError('Vui lòng chọn ít nhất một ngày trong tuần.');
      return;
    }
    schedule.time = formTime.value;
    schedule.days = selectedWeekdays;
  } else if (type === SCHEDULE_TYPES.INTERVAL) {
    const min = Number(formInterval.value);
    if (isNaN(min) || min < 1 || min > 1440) {
      showFormError('Khoảng thời gian định kỳ phải từ 1 đến 1440 phút.');
      return;
    }
    schedule.intervalMinutes = min;
  }

  const reminderPayload = {
    id: formId.value || undefined,
    title,
    message,
    enabled: true,
    schedule,
    notification: { enabled: true },
    sound: {
      enabled: soundId !== SOUND_IDS.NONE,
      soundId,
    },
  };

  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.SAVE_REMINDER,
    reminder: reminderPayload,
  }, (res) => {
    if (res?.success) {
      closeModal();
      loadData();
    } else {
      showFormError(res?.error || 'Không thể lưu lời nhắc.');
    }
  });
}

function showFormError(msg) {
  formErrorMsg.textContent = msg;
  formErrorMsg.style.display = 'block';
}

/**
 * Starts continuous countdown ticker for upcoming reminder
 */
function startCountdownTicker() {
  if (tickerInterval) clearInterval(tickerInterval);
  tickerInterval = setInterval(() => {
    if (nextReminder && nextReminder.nextTriggerAt > Date.now()) {
      elNextCountdown.textContent = getTimeRemaining(nextReminder.nextTriggerAt);
    }
  }, 10000);
}

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
  // Open Settings page
  btnOpenOptions.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('src/options/options.html'));
    }
  });

  // Open Add Modal
  btnShowAdd.addEventListener('click', () => openModal());
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelForm.addEventListener('click', closeModal);

  // Filter tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderRemindersList();
    });
  });

  // Schedule type change
  document.querySelectorAll('input[name="schedule_type"]').forEach((radio) => {
    radio.addEventListener('change', updateScheduleFieldsVisibility);
  });

  // Weekday pills toggle
  document.querySelectorAll('.day-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      const day = Number(e.target.dataset.day);
      if (selectedWeekdays.includes(day)) {
        if (selectedWeekdays.length > 1) {
          selectedWeekdays = selectedWeekdays.filter((d) => d !== day);
        }
      } else {
        selectedWeekdays.push(day);
      }
      updateWeekdayPillsUI();
    });
  });

  // Interval quick buttons
  document.querySelectorAll('.btn-micro').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      formInterval.value = e.target.dataset.val;
    });
  });

  // Quick Presets in Empty State
  document.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const title = target.dataset.title;
      const type = target.dataset.type;
      const time = target.dataset.time;
      const interval = target.dataset.interval;

      openModal();
      formTitle.value = title;
      const typeRadio = document.querySelector(`input[name="schedule_type"][value="${type}"]`);
      if (typeRadio) typeRadio.checked = true;
      if (time) formTime.value = time;
      if (interval) formInterval.value = interval;
      updateScheduleFieldsVisibility();
    });
  });

  // Test sound preview
  btnPopupTestSound.addEventListener('click', () => {
    const soundId = formSound.value;
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TEST_SOUND,
      soundId,
    });
  });

  // Form Submit
  reminderForm.addEventListener('submit', handleFormSubmit);

  // List card interactions (Toggle, Edit, Delete)
  elRemindersList.addEventListener('click', (e) => {
    const btnDel = e.target.closest('.btn-del');
    const btnEdit = e.target.closest('.btn-edit');
    const toggle = e.target.closest('.toggle-status');

    if (btnDel) {
      const id = btnDel.dataset.id;
      if (confirm('Bạn có chắc muốn xóa lời nhắc này?')) {
        chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_REMINDER, id }, () => {
          loadData();
        });
      }
      return;
    }

    if (btnEdit) {
      const id = btnEdit.dataset.id;
      const reminder = allReminders.find((r) => r.id === id);
      if (reminder) openModal(reminder);
      return;
    }

    if (toggle) {
      const id = toggle.dataset.id;
      const enabled = toggle.checked;
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TOGGLE_REMINDER, id, enabled }, () => {
        loadData();
      });
      return;
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[m]));
}

// Boot
document.addEventListener('DOMContentLoaded', initPopup);
