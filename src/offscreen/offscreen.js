/**
 * Offscreen Document Script
 * Handles real audio playback in Manifest V3 without opening visible windows or tabs.
 */

import { MESSAGE_TYPES } from '../utils/constants.js';

const audioElement = document.getElementById('audio-player');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.PLAY_SOUND || message.type === MESSAGE_TYPES.TEST_SOUND) {
    playAudio(message.soundFile, message.volume)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error('[OffscreenAudio] Play error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === MESSAGE_TYPES.STOP_SOUND) {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    sendResponse({ success: true });
    return true;
  }
});

async function playAudio(soundFile, volume = 0.8) {
  if (!audioElement || !soundFile) return;

  try {
    const fullUrl = chrome.runtime.getURL(soundFile);
    audioElement.src = fullUrl;
    audioElement.volume = Math.max(0, Math.min(1, Number(volume) || 0.8));
    await audioElement.play();
  } catch (err) {
    console.warn('[OffscreenAudio] Error playing audio:', err);
    throw err;
  }
}
