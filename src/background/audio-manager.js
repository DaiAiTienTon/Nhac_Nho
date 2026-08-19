/**
 * Audio Manager Service
 * Manages offscreen document lifecycle and audio playback dispatching for Service Worker.
 */

import { SOUND_FILES, SOUND_IDS, MESSAGE_TYPES } from '../utils/constants.js';

const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen/offscreen.html';

export class AudioManager {
  constructor() {
    this.creatingPromise = null;
  }

  /**
   * Ensures an offscreen document is open for audio playback
   */
  async ensureOffscreenDocument() {
    if (typeof chrome === 'undefined' || !chrome.offscreen) {
      return;
    }

    if (await this.hasOffscreenDocument()) {
      return;
    }

    if (this.creatingPromise) {
      await this.creatingPromise;
      return;
    }

    this.creatingPromise = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Playback notification chime sounds for event reminders',
    });

    try {
      await this.creatingPromise;
    } catch (err) {
      // Ignore if document already exists
      if (!err.message.includes('Only a single offscreen document may exist')) {
        console.error('[AudioManager] Failed to create offscreen document:', err);
      }
    } finally {
      this.creatingPromise = null;
    }
  }

  /**
   * Checks if an offscreen document currently exists
   * @returns {Promise<boolean>}
   */
  async hasOffscreenDocument() {
    if (typeof chrome === 'undefined' || !chrome.runtime?.getContexts) {
      // Fallback for environments without getContexts API
      if (typeof chrome !== 'undefined' && chrome.offscreen && chrome.offscreen.hasDocument) {
        return chrome.offscreen.hasDocument();
      }
      return false;
    }

    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
    });
    return contexts.length > 0;
  }

  /**
   * Plays a specific sound at a given volume
   * @param {string} soundId
   * @param {number} [volume=0.8]
   * @returns {Promise<boolean>}
   */
  async playSound(soundId = SOUND_IDS.DEFAULT, volume = 0.8) {
    if (soundId === SOUND_IDS.NONE) return true;

    const soundFile = SOUND_FILES[soundId] || SOUND_FILES[SOUND_IDS.DEFAULT];

    if (typeof chrome === 'undefined' || !chrome.offscreen) {
      console.log(`[AudioManager Mock] Playing sound: ${soundFile} at volume ${volume}`);
      return true;
    }

    try {
      await this.ensureOffscreenDocument();

      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: MESSAGE_TYPES.PLAY_SOUND,
            soundFile,
            volume,
          },
          (response) => {
            if (chrome.runtime?.lastError) {
              console.warn('[AudioManager] Sound playback message warning:', chrome.runtime.lastError);
              resolve(false);
              return;
            }
            resolve(response?.success ?? true);
          }
        );
      });
    } catch (err) {
      console.error('[AudioManager] Error playing sound:', err);
      return false;
    }
  }

  /**
   * Stops any currently playing audio
   */
  async stopSound() {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
    try {
      if (await this.hasOffscreenDocument()) {
        chrome.runtime.sendMessage({ type: MESSAGE_TYPES.STOP_SOUND });
      }
    } catch (e) {
      // ignore
    }
  }
}
