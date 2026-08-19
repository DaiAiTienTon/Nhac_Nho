import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const baseDir = path.resolve('assets');
const iconsDir = path.join(baseDir, 'icons');
const soundsDir = path.join(baseDir, 'sounds');

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(soundsDir, { recursive: true });

// --- 1. Sound Generator (WAV standard PCM 44.1kHz 16-bit Mono) ---
function generateWav(frequencies, durationSec = 1.0, type = 'sine') {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // PCM audio format
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24); // Sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    frequencies.forEach((freq, idx) => {
      const weight = 1 / (idx + 1);
      const phase = 2 * Math.PI * freq * t;
      const wave = Math.sin(phase);
      sample += wave * weight;
    });

    // ADSR Envelope: Fast attack, gentle decay
    const attackTime = 0.03;
    const decayTime = durationSec - attackTime;
    let envelope = 0;
    if (t < attackTime) {
      envelope = t / attackTime;
    } else {
      const progress = (t - attackTime) / decayTime;
      envelope = Math.exp(-progress * 3.5);
    }

    const finalSample = Math.max(-1, Math.min(1, sample * envelope * 0.7));
    const int16 = Math.floor(finalSample * 32767);
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return buffer;
}

// Generate sound files
// 1. Default: Warm dual-tone chime (587Hz D5 + 880Hz A5)
fs.writeFileSync(path.join(soundsDir, 'default.wav'), generateWav([587.33, 880.0], 1.2));
// 2. Soft: Gentle peaceful tone (440Hz A4 + 554Hz C#5)
fs.writeFileSync(path.join(soundsDir, 'soft.wav'), generateWav([440.0, 554.37], 1.5));
// 3. Bell: Bright crisp bell chime (659Hz E5 + 1046.5Hz C6)
fs.writeFileSync(path.join(soundsDir, 'bell.wav'), generateWav([659.25, 1046.5], 1.4));

console.log('✓ Generated sounds: default.wav, soft.wav, bell.wav');

// --- 2. Pure PNG Image Generator ---
// Helper to create valid PNG with RGBA buffer
function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const srcOffset = (y * width + x) * 4;
      const dstOffset = rowOffset + 1 + x * 4;
      rawData[dstOffset] = rgbaBuffer[srcOffset];
      rawData[dstOffset + 1] = rgbaBuffer[srcOffset + 1];
      rawData[dstOffset + 2] = rgbaBuffer[srcOffset + 2];
      rawData[dstOffset + 3] = rgbaBuffer[srcOffset + 3];
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', idatCompressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc >>> 0, 8 + len);
  return buf;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return ~crc;
}

// Generate premium Icon with Bell & Ring gradient
function generateIcon(size) {
  const buffer = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded squircle / circle with modern indigo-violet gradient
      if (dist <= radius) {
        // Gradient from #6366F1 (Indigo) to #8B5CF6 (Purple) to #3B82F6 (Blue)
        const t = (x + y) / (size * 2);
        const r = Math.floor(79 + t * (139 - 79));
        const g = Math.floor(70 + t * (92 - 70));
        const b = Math.floor(229 + t * (246 - 229));

        // Draw inner bell shape or clock hand
        // Bell silhouette in white
        const relX = (x - center) / (size * 0.4);
        const relY = (y - center) / (size * 0.4);

        const inBellTop = relY >= -0.6 && relY <= 0.1 && Math.abs(relX) <= 0.15 + (relY + 0.6) * 0.45;
        const inBellFlange = relY > 0.1 && relY <= 0.35 && Math.abs(relX) <= 0.5;
        const inBellClapper = relY > 0.35 && relY <= 0.55 && Math.abs(relX) <= 0.2;
        const inBellLoop = relY >= -0.8 && relY < -0.6 && Math.abs(relX) <= 0.12;

        if (inBellTop || inBellFlange || inBellClapper || inBellLoop) {
          // Pure crisp white with subtle glow
          buffer[offset] = 255;
          buffer[offset + 1] = 255;
          buffer[offset + 2] = 255;
          buffer[offset + 3] = 255;
        } else {
          // Antialiased edge
          const alpha = dist > radius - 1 ? Math.floor((radius - dist) * 255) : 255;
          buffer[offset] = r;
          buffer[offset + 1] = g;
          buffer[offset + 2] = b;
          buffer[offset + 3] = Math.max(0, Math.min(255, alpha));
        }
      } else if (dist <= radius + 1) {
        // Anti-aliased outer rim
        const alpha = Math.max(0, Math.floor((radius + 1 - dist) * 255));
        buffer[offset] = 99;
        buffer[offset + 1] = 102;
        buffer[offset + 2] = 241;
        buffer[offset + 3] = alpha;
      }
    }
  }

  return createPng(size, size, buffer);
}

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), generateIcon(16));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), generateIcon(48));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), generateIcon(128));

console.log('✓ Generated icons: icon16.png, icon48.png, icon128.png');
