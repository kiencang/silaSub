import { Injectable, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AppStateService } from './app.state.service';
import { PlayerService } from './player.service';

@Injectable({
  providedIn: 'root'
})
export class TtsService {
  private platformId = inject(PLATFORM_ID);
  private appState = inject(AppStateService);
  private playerService = inject(PlayerService);
  
  isTtsEnabled = signal(false);
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  
  // Track the offset of the currently spoken line to avoid repeating
  private currentlySpokenOffset = -1;

  private originalVolume = -1;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.synthesis = window.speechSynthesis;
      
      // Load voices (some browsers require an event)
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => {
          this.getVietnameseVoice();
        };
      }

      // Effect to handle video volume when TTS is toggled
      effect(() => {
        const ttsEnabled = this.isTtsEnabled();
        const isReady = this.playerService.isYtReady(); // Add signal tracking
        
        // Ensure player is ready and methods exist
        if (!isReady || !this.playerService.player || typeof this.playerService.getVolume !== 'function') {
          return;
        }

        if (ttsEnabled) {
          if (this.originalVolume === -1) {
             this.originalVolume = this.playerService.getVolume();
          }
          // Lower the volume to 10% so the video is in the background
          this.playerService.setVolume(10);
        } else {
          if (this.originalVolume !== -1) {
             this.playerService.setVolume(this.originalVolume);
             this.originalVolume = -1;
          }
        }
      });
      
      // Effect to watch current line and speak if TTS is enabled and video is playing
      effect(() => {
        const line = this.appState.currentLine();
        const ttsEnabled = this.isTtsEnabled();
        const isPlaying = this.playerService.isPlaying();
        
        if (!ttsEnabled || !isPlaying) {
          this.stop();
          this.currentlySpokenOffset = -1;
          return;
        }

        if (line && line.viText) {
          // Check if we are already speaking this line
          if (this.currentlySpokenOffset !== line.offset) {
             this.currentlySpokenOffset = line.offset;
             this.speak(line.viText, line.duration);
          }
        }
      });
    }
  }

  private getVietnameseVoice(): SpeechSynthesisVoice | null {
    if (!this.synthesis) return null;
    const voices = this.synthesis.getVoices();
    
    const viVoices = voices.filter(v => 
      v.lang.toLowerCase().includes('vi') || 
      v.name.toLowerCase().includes('vietnamese') ||
      v.name.toLowerCase().includes('việt') ||
      v.name.toLowerCase().includes('microsoft an') ||
      v.name.toLowerCase().includes('hoaimy')
    );

    if (viVoices.length === 0) return null;

    // 1. Try to find a Vietnamese Natural/Online voice first
    // Edge uses "Natural" or "Online", but it might be localized to "Tự nhiên" or "Trực tuyến"
    const naturalVoice = viVoices.find(v => 
      v.name.toLowerCase().includes('natural') || 
      v.name.toLowerCase().includes('online') ||
      v.name.toLowerCase().includes('tự nhiên') ||
      v.name.toLowerCase().includes('trực tuyến') ||
      v.name.toLowerCase().includes('hoaimy') // HoaiMy is Edge's Natural voice
    );

    return naturalVoice || viVoices[0];
  }

  speak(text: string, durationInSeconds: number) {
    if (!this.synthesis) return;
    
    // Stop any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.getVietnameseVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'vi-VN';
    }

    // Adjust duration based on video playback rate
    const videoRate = this.playerService.playbackRate() || 1.0;
    const actualDuration = durationInSeconds / videoRate;

    // A conservative estimate: TTS reads roughly 13 characters per second at normal speed (rate=1.0)
    // Assuming a lower characters-per-second forces the calculated rate to be HIGHER,
    // ensuring the speech finishes within the target actualDuration.
    const BASE_CHARS_PER_SEC = 13;
    const estimatedDuration = text.length / BASE_CHARS_PER_SEC;
    
    let rate = 1.0;
    if (actualDuration > 0) {
       rate = estimatedDuration / actualDuration;
    }
    
    // Clamp the rate so it doesn't sound completely broken.
    // Minimum 0.95 (don't speak too slowly even if there's plenty of time)
    // Maximum 3.0 (speak very fast if needed)
    rate = Math.max(0.95, Math.min(rate, 3.0));
    
    utterance.rate = rate;
    this.currentUtterance = utterance;
    
    this.synthesis.speak(utterance);
  }

  stop() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }
}
