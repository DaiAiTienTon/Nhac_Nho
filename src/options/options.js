/**
 * Options Page Controller
 */

import { StorageManager } from '../storage/storage-manager.js';
import { MESSAGE_TYPES, SOUND_IDS, NOTIFICATION_PRIORITIES } from '../utils/constants.js';

// DOM Elements
const elEnabled = document.getElementById('setting-enabled');
const elNotifEnabled = document.getElementById('notif-enabled');
const elNotifPriority = document.getElementById('notif-priority');
const elAudioEnabled = document.getElementById('audio-enabled');
const elAudioDefaultSound = document.getElementById('audio-default-sound');
const elAudioVolume = document.getElementById('audio-volume');
const elVolumeVal = document.getElementById('volume-val');

const elGlobalStatusBadge = document.getElementById('global-status-badge');
const elGlobalStatusText = document.getElementById('global-status-text');

const btnSaveSettings = document.getElementById('btn-save-settings');
const btnTestSound = document.getElementById('btn-test-sound');
const btnExportData = document.getElementById('btn-export-data');
const fileImportData = document.getElementById('file-import-data');
const btnSyncAlarms = document.getElementById('btn-sync-alarms');
const btnResetData = document.getElementById('btn-reset-data');
const toastMessage = document.getElementById('toast-message');

/**
 * Shows temporary toast message
 */
function showToast(text, type = 'success', duration = 3000) {
  toastMessage.textContent = text;
  toastMessage.className = `toast-message ${type}`;
  setTimeout(() => {
    toastMessage.textContent = '';
    toastMessage.className = 'toast-message';
  }, duration);
}

/**
 * Updates UI status badge
 */
function updateStatusBadge(enabled) {
  if (enabled) {
    elGlobalStatusBadge.className = 'status-badge';
    elGlobalStatusText.textContent = 'Đang hoạt động';
  } else {
    elGlobalStatusBadge.className = 'status-badge disabled';
    elGlobalStatusText.textContent = 'Đã tạm dừng';
  }
}

/**
 * Loads current settings into UI controls
 */
async function loadSettings() {
  const settings = await StorageManager.getSettings();

  elEnabled.checked = Boolean(settings.enabled);
  elNotifEnabled.checked = Boolean(settings.notifications?.enabled);
  elNotifPriority.value = settings.notifications?.priority || NOTIFICATION_PRIORITIES.NORMAL;
  elAudioEnabled.checked = Boolean(settings.audio?.enabled);
  elAudioDefaultSound.value = settings.audio?.defaultSound || SOUND_IDS.DEFAULT;

  const vol = settings.audio?.volume !== undefined ? settings.audio.volume : 0.8;
  elAudioVolume.value = vol;
  elVolumeVal.textContent = `${Math.round(vol * 100)}%`;

  updateStatusBadge(settings.enabled);
}

/**
 * Collects and saves settings
 */
async function saveSettings() {
  const settings = {
    enabled: elEnabled.checked,
    notifications: {
      enabled: elNotifEnabled.checked,
      priority: elNotifPriority.value,
    },
    audio: {
      enabled: elAudioEnabled.checked,
      defaultSound: elAudioDefaultSound.value,
      volume: parseFloat(elAudioVolume.value),
    },
  };

  const result = await StorageManager.saveSettings(settings);
  if (result.success) {
    updateStatusBadge(settings.enabled);
    showToast('✓ Đã lưu cài đặt thành công!', 'success');
  } else {
    showToast(`✕ Lỗi: ${result.error}`, 'error');
  }
}

/**
 * Tests selected sound and volume
 */
function testSound() {
  const soundId = elAudioDefaultSound.value;
  const volume = parseFloat(elAudioVolume.value);

  if (soundId === SOUND_IDS.NONE) {
    showToast('Âm thanh đang chọn là Không phát.', 'error');
    return;
  }

  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.TEST_SOUND,
    soundId,
    volume,
  }, (res) => {
    if (res?.success) {
      showToast('Đang phát chuông thử nghiệm...', 'success', 1500);
    }
  });
}

/**
 * Exports data to JSON file
 */
async function exportData() {
  const data = await StorageManager.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `event-reminders-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Đã xuất file sao lưu thành công!', 'success');
}

/**
 * Imports data from JSON file
 */
function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const result = await StorageManager.importData(data);
      if (result.success) {
        await loadSettings();
        chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SYNC_ALARMS });
        showToast(`✓ Đã nhập thành công ${result.importedCount} lời nhắc!`, 'success');
      } else {
        showToast(`✕ Lỗi: ${result.error}`, 'error', 4000);
      }
    } catch (err) {
      showToast('✕ File JSON không hợp lệ!', 'error');
    }
    event.target.value = ''; // Reset input
  };
  reader.readAsText(file);
}

/**
 * Triggers Alarm sync
 */
function syncAlarms() {
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SYNC_ALARMS }, (res) => {
    if (res?.success) {
      showToast(`✓ Đã đồng bộ ${res.synced} lịch nhắc nhở!`, 'success');
    } else {
      showToast('✕ Lỗi khi đồng bộ alarms.', 'error');
    }
  });
}

/**
 * Resets all data with user confirmation
 */
async function resetAllData() {
  const confirmed = confirm(
    'CẢNH BÁO: Hành động này sẽ xóa toàn bộ các lời nhắc sự kiện đã tạo và khôi phục cài đặt về mặc định. Bạn có chắc chắn muốn tiếp tục?'
  );
  if (!confirmed) return;

  await StorageManager.resetAll();
  await loadSettings();
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SYNC_ALARMS });
  showToast('✓ Đã xóa toàn bộ dữ liệu và đặt lại mặc định.', 'success');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadSettings);
btnSaveSettings.addEventListener('click', saveSettings);
btnTestSound.addEventListener('click', testSound);
btnExportData.addEventListener('click', exportData);
fileImportData.addEventListener('change', importData);
btnSyncAlarms.addEventListener('click', syncAlarms);
btnResetData.addEventListener('click', resetAllData);

elAudioVolume.addEventListener('input', (e) => {
  elVolumeVal.textContent = `${Math.round(e.target.value * 100)}%`;
});

elEnabled.addEventListener('change', (e) => {
  updateStatusBadge(e.target.checked);
});
