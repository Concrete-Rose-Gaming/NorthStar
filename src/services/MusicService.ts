// Music service for managing game audio

class MusicService {
  private introAudio: HTMLAudioElement | null = null;
  private gameplayAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private currentVolume: number = 0.3; // 30% volume by default
  
  private readonly INTRO_MUSIC = `${process.env.PUBLIC_URL}/music/intro.mp3`;
  private readonly MULLIGAN_MUSIC = `${process.env.PUBLIC_URL}/music/the-show-intro-162872.mp3`;
  private readonly GAMEPLAY_MUSIC = `${process.env.PUBLIC_URL}/music/cooking-159122.mp3`;

  constructor() {
    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem('musicMuted');
    if (savedMuteState !== null) {
      this.isMuted = savedMuteState === 'true';
    }
  }

  // Play intro music (loops)
  playIntro() {
    this.stopAll();
    
    if (!this.introAudio) {
      this.introAudio = new Audio(this.INTRO_MUSIC);
      this.introAudio.loop = true;
      this.introAudio.volume = this.isMuted ? 0 : this.currentVolume;
    }
    
    if (!this.isMuted) {
      this.introAudio.play().catch(err => {
        console.error('Failed to play intro music:', err);
      });
    }
  }

  // Play mulligan-phase music "the show intro" (loops)
  playMulliganMusic() {
    this.stopAll();

    if (!this.gameplayAudio) {
      this.gameplayAudio = new Audio(this.MULLIGAN_MUSIC);
    } else {
      this.gameplayAudio.src = this.MULLIGAN_MUSIC;
    }

    this.gameplayAudio.loop = true;
    this.gameplayAudio.volume = this.isMuted ? 0 : this.currentVolume;

    if (!this.isMuted) {
      this.gameplayAudio.play().catch(err => {
        console.error('Failed to play mulligan music:', err);
      });
    }
  }

  // Play standard gameplay music cooking-159122 (loops)
  playGameplayMusic() {
    this.stopAll();

    if (!this.gameplayAudio) {
      this.gameplayAudio = new Audio(this.GAMEPLAY_MUSIC);
    } else {
      this.gameplayAudio.src = this.GAMEPLAY_MUSIC;
    }

    this.gameplayAudio.loop = true;
    this.gameplayAudio.volume = this.isMuted ? 0 : this.currentVolume;

    if (!this.isMuted) {
      this.gameplayAudio.play().catch(err => {
        console.error('Failed to play gameplay music:', err);
      });
    }
  }

  // Stop all music
  stopAll() {
    if (this.introAudio) {
      this.introAudio.pause();
      this.introAudio.currentTime = 0;
    }
    if (this.gameplayAudio) {
      this.gameplayAudio.pause();
      this.gameplayAudio.currentTime = 0;
    }
  }

  // Toggle mute
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('musicMuted', this.isMuted.toString());
    
    // Update volume for currently playing audio
    if (this.introAudio) {
      this.introAudio.volume = this.isMuted ? 0 : this.currentVolume;
    }
    if (this.gameplayAudio) {
      this.gameplayAudio.volume = this.isMuted ? 0 : this.currentVolume;
    }
    
    return this.isMuted;
  }

  // Get current mute state
  getMuted(): boolean {
    return this.isMuted;
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (!this.isMuted) {
      if (this.introAudio) {
        this.introAudio.volume = this.currentVolume;
      }
      if (this.gameplayAudio) {
        this.gameplayAudio.volume = this.currentVolume;
      }
    }
  }
}

// Singleton instance
export const musicService = new MusicService();
