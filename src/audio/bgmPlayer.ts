/**
 * Background Music (BGM) Manager & Playlist Engine
 * Connected with persistent IndexedDB storage so user's exact original files are saved permanently.
 */
import { saveAudioToStorage, loadAllSavedAudios, removeAudioFromStorage } from './persistentStorage';

export interface BGMTrack {
  id: string;
  title: string;
  titleAr: string;
  src: string;
  isCustom?: boolean;
}

export const DEFAULT_PLAYLIST: BGMTrack[] = [
  {
    id: 'track_music_box',
    title: 'House Music Box Theme',
    titleAr: 'لحن صندوق الموسيقى (House)',
    src: '/audio/track1_music_box.wav',
  },
  {
    id: 'track_dark_ambient',
    title: 'Nightmare Darkness Ambient',
    titleAr: 'أجواء عتمة الكوابيس والتوتر',
    src: '/audio/track2_dark_ambient.wav',
  },
];

class BGMPlayer {
  private audio: HTMLAudioElement | null = null;
  private playlist: BGMTrack[] = [...DEFAULT_PLAYLIST];
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.55;
  private isMuted: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
      this.loadSavedTracks();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = this.volume;
    this.audio.src = this.playlist[this.currentTrackIndex]?.src || '';
  }

  public async loadSavedTracks() {
    try {
      const saved = await loadAllSavedAudios();
      if (saved.length > 0) {
        const customTracks: BGMTrack[] = saved.map((s) => ({
          id: s.id,
          title: s.name,
          titleAr: `ملفك الأصلي: ${s.name}`,
          src: s.url,
          isCustom: true,
        }));

        // Put user's exact saved files at the top of the playlist!
        this.playlist = [...customTracks, ...DEFAULT_PLAYLIST];
        this.currentTrackIndex = 0;
        if (this.audio) {
          this.audio.src = this.playlist[0].src;
        }
        this.notify();
      }
    } catch {
      // storage error safety
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getPlaylist(): BGMTrack[] {
    return this.playlist;
  }

  public getCurrentTrack(): BGMTrack {
    return this.playlist[this.currentTrackIndex] || this.playlist[0];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public async play() {
    this.initAudio();
    if (!this.audio) return;

    try {
      this.audio.muted = this.isMuted;
      this.audio.volume = this.volume;
      await this.audio.play();
      this.isPlaying = true;
      this.notify();
    } catch {
      // Autoplay safety
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setTrack(index: number) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    const wasPlaying = this.isPlaying;

    if (this.audio) {
      this.audio.pause();
      this.audio.src = this.playlist[this.currentTrackIndex].src;
      this.audio.load();
      if (wasPlaying) {
        this.play();
      }
    }
    this.notify();
  }

  public nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
    this.setTrack(nextIdx);
  }

  public prevTrack() {
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.setTrack(prevIdx);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.notify();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.muted = muted;
    }
    this.notify();
  }

  public async addCustomTrack(file: File) {
    const id = `user_track_${Date.now()}`;
    const cleanName = file.name.replace(/\.[^/.]+$/, '');

    // 1. Save permanently to IndexedDB
    await saveAudioToStorage(id, cleanName, file);

    // 2. Create object URL
    const fileUrl = URL.createObjectURL(file);
    const newTrack: BGMTrack = {
      id,
      title: cleanName,
      titleAr: `ملفك الأصلي: ${cleanName}`,
      src: fileUrl,
      isCustom: true,
    };

    // Put at top of playlist
    this.playlist.unshift(newTrack);
    this.setTrack(0);
    this.play();
    this.notify();
  }

  public async removeTrack(id: string) {
    await removeAudioFromStorage(id);
    this.playlist = this.playlist.filter((t) => t.id !== id);
    if (this.currentTrackIndex >= this.playlist.length) {
      this.currentTrackIndex = 0;
    }
    if (this.audio && this.playlist.length > 0) {
      this.audio.src = this.playlist[this.currentTrackIndex].src;
    }
    this.notify();
  }
}

export const bgmPlayer = new BGMPlayer();
