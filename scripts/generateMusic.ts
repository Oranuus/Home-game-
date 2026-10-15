import * as fs from 'fs';
import * as path from 'path';

function writeWavFile(filename: string, sampleRate: number, channels: number, samples: Float32Array[]) {
  const numSamples = samples[0].length;
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const buffer = Buffer.alloc(44 + numSamples * channels * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * channels * 2, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16 bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * channels * 2, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < channels; ch++) {
      let s = Math.max(-1, Math.min(1, samples[ch][i]));
      const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
      buffer.writeInt16LE(Math.round(intSample), offset);
      offset += 2;
    }
  }

  fs.writeFileSync(filename, buffer);
  console.log(`Saved ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// 1. Generate House Music Box Theme (Track 1)
function generateMusicBox() {
  const sampleRate = 44100;
  const duration = 28; // 28 seconds loop
  const totalSamples = sampleRate * duration;
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // Note frequency helper
  const noteFreq = (note: string): number => {
    const notes: Record<string, number> = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'E3': 164.81
    };
    return notes[note] || 440;
  };

  const playMusicBoxPluck = (startSec: number, freq: number, pan: number = 0, vol: number = 0.35) => {
    const startSample = Math.floor(startSec * sampleRate);
    const noteDuration = 2.4;
    const len = Math.floor(noteDuration * sampleRate);

    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / sampleRate;
      // Exponential decay
      const env = Math.exp(-t * 2.8) * vol;
      // Music box harmonics (fundamental + metallic partials)
      const s1 = Math.sin(2 * Math.PI * freq * t);
      const s2 = Math.sin(2 * Math.PI * freq * 2.76 * t) * 0.45;
      const s3 = Math.sin(2 * Math.PI * freq * 5.42 * t) * 0.22;
      const s4 = Math.sin(2 * Math.PI * freq * 8.1 * t) * 0.08;
      // Mechanical tiny click transient at start
      const click = t < 0.005 ? (Math.random() - 0.5) * 0.3 * Math.exp(-t * 500) : 0;

      const wave = (s1 + s2 + s3 + s4 + click) * env;

      const leftGain = (1 - pan) * 0.5;
      const rightGain = (1 + pan) * 0.5;

      left[idx] += wave * leftGain;
      right[idx] += wave * rightGain;
    }
  };

  // Melody sequence (Iconic haunting House lullaby)
  const melody: [number, string, number][] = [
    // [time, note, pan]
    [0.0, 'E5', -0.2],
    [0.7, 'B4', 0.2],
    [1.4, 'C5', -0.1],
    [2.1, 'A4', 0.3],
    [2.8, 'G4', -0.3],
    [3.5, 'E4', 0.1],
    [4.2, 'B4', -0.2],
    [4.9, 'A4', 0.2],

    [6.0, 'C5', -0.2],
    [6.7, 'E5', 0.2],
    [7.4, 'D5', -0.1],
    [8.1, 'B4', 0.3],
    [8.8, 'C5', -0.2],
    [9.5, 'A4', 0.1],
    [10.2, 'B4', 0.2],
    [11.0, 'G4', -0.2],
    [11.8, 'E4', 0.0],

    // Second variation
    [13.5, 'E5', -0.3],
    [14.2, 'G5', 0.2],
    [14.9, 'B5', -0.1],
    [15.6, 'A5', 0.3],
    [16.3, 'G5', -0.2],
    [17.0, 'E5', 0.1],
    [17.7, 'F#5', -0.1],
    [18.5, 'D5', 0.2],

    [19.8, 'C5', -0.2],
    [20.5, 'E5', 0.3],
    [21.2, 'B4', -0.1],
    [22.0, 'A4', 0.2],
    [22.8, 'G4', -0.3],
    [23.6, 'E4', 0.0],
    [24.5, 'B3', -0.2],
    [25.5, 'E4', 0.0],
  ];

  // Bass accompaniment
  const bass: [number, string, number][] = [
    [0.0, 'E3', -0.1],
    [1.4, 'A3', 0.1],
    [2.8, 'G3', -0.1],
    [4.2, 'B3', 0.1],
    [6.0, 'A3', -0.1],
    [7.4, 'E3', 0.1],
    [8.8, 'A3', -0.1],
    [10.2, 'E3', 0.1],
    [13.5, 'E3', -0.1],
    [14.9, 'G3', 0.1],
    [16.3, 'A3', -0.1],
    [17.7, 'B3', 0.1],
    [19.8, 'A3', -0.1],
    [21.2, 'E3', 0.1],
    [23.6, 'E3', 0.0],
  ];

  melody.forEach(([time, note, pan]) => {
    playMusicBoxPluck(time, noteFreq(note), pan, 0.4);
  });

  bass.forEach(([time, note, pan]) => {
    playMusicBoxPluck(time, noteFreq(note), pan, 0.25);
  });

  // Subtle clock ticking in background
  for (let t = 0; t < duration; t += 1.0) {
    const idx = Math.floor(t * sampleRate);
    if (idx < totalSamples) {
      for (let k = 0; k < 800; k++) {
        if (idx + k < totalSamples) {
          const click = Math.sin(k * 0.15) * Math.exp(-k * 0.015) * 0.05;
          left[idx + k] += click;
          right[idx + k] += click;
        }
      }
    }
  }

  writeWavFile('/public/audio/track1_music_box.wav', sampleRate, 2, [left, right]);
}

// 2. Generate Dark Ambient Nightmare Theme (Track 2)
function generateDarkAmbient() {
  const sampleRate = 44100;
  const duration = 28;
  const totalSamples = sampleRate * duration;
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // Deep Sub Drone (55Hz / 73.4Hz with detuning)
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Slow pulsing volume LFO
    const lfo1 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.08 * t);
    const lfo2 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.13 * t);

    // Deep detuned sine and triangle waves
    const sub1 = Math.sin(2 * Math.PI * 55 * t);
    const sub2 = Math.sin(2 * Math.PI * 55.4 * t);
    const sub3 = Math.sin(2 * Math.PI * 73.4 * t + 0.5) * 0.6;
    const sub4 = Math.sin(2 * Math.PI * 110 * t) * 0.3;

    // Atmospheric filtered noise wind
    const noise = (Math.random() - 0.5) * 0.08 * lfo1;

    const baseDroneL = (sub1 * 0.4 + sub2 * 0.3 + sub3 * 0.25 + sub4 * 0.15 + noise) * lfo1 * 0.4;
    const baseDroneR = (sub2 * 0.4 + sub1 * 0.3 + sub3 * 0.25 + sub4 * 0.15 + noise) * lfo2 * 0.4;

    left[i] += baseDroneL;
    right[i] += baseDroneR;
  }

  // Creepy high dissonant pulses (Celesta/Bell chime echoes)
  const bellEvents: [number, number, number][] = [
    [1.5, 932.33, -0.4], // Bb5
    [4.8, 659.25, 0.4],  // E5
    [8.2, 739.99, -0.3], // F#5
    [12.0, 523.25, 0.3], // C5
    [15.5, 622.25, -0.2],// Eb5
    [19.0, 932.33, 0.4], // Bb5
    [22.5, 659.25, -0.3],// E5
    [25.8, 587.33, 0.2], // D5
  ];

  bellEvents.forEach(([time, freq, pan]) => {
    const startSample = Math.floor(time * sampleRate);
    const len = Math.floor(4.0 * sampleRate);
    for (let i = 0; i < len; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const t = i / sampleRate;
      const env = Math.exp(-t * 1.2) * 0.2;
      const chime = Math.sin(2 * Math.PI * freq * t) + Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.3;

      left[idx] += chime * env * (1 - pan) * 0.5;
      right[idx] += chime * env * (1 + pan) * 0.5;
    }
  });

  // Heavy heartbeat thud recurring in the ambient
  for (let t = 0; t < duration; t += 2.2) {
    const idx = Math.floor(t * sampleRate);
    const len = Math.floor(0.4 * sampleRate);
    for (let i = 0; i < len; i++) {
      const cur = idx + i;
      if (cur >= totalSamples) break;
      const time = i / sampleRate;
      const thud = Math.sin(2 * Math.PI * 48 * time) * Math.exp(-time * 14) * 0.35;
      left[cur] += thud;
      right[cur] += thud;
    }
  }

  writeWavFile('/public/audio/track2_dark_ambient.wav', sampleRate, 2, [left, right]);
}

// Run generators
generateMusicBox();
generateDarkAmbient();
console.log('Audio generation completed successfully!');
