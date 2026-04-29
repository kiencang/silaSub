/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private platformId = inject(PLATFORM_ID);
  
  currentTime = signal(0);
  isYtReady = signal(false);
  isFullscreen = signal(false);
  
  player: any;
  private timer: ReturnType<typeof setInterval> | undefined;

  init() {
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener("fullscreenchange", () => {
        this.isFullscreen.set(!!document.fullscreenElement);
      });

      if (!(window as any).YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = () => {
          this.isYtReady.set(true);
        };
      } else {
        this.isYtReady.set(true);
      }

      this.timer = setInterval(() => {
        if (this.player && typeof this.player.getCurrentTime === "function") {
          const state = this.player.getPlayerState();
          if (state === 1 || state === 2) {
            this.currentTime.set(this.player.getCurrentTime());
          }
        }
      }, 100);
    }
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
  }

  loadVideo(id: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    setTimeout(() => {
      if (this.player && this.player.loadVideoById) {
        this.player.loadVideoById(id);
      } else {
        const container = document.getElementById("yt-player-container");
        if (container) {
          this.player = new (window as any).YT.Player(
            "yt-player-container",
            {
               videoId: id,
               playerVars: { autoplay: 0, rel: 0, fs: 0 }
            }
          );
        }
      }
    }, 0);
  }

  stopVideo() {
    if (this.player && typeof this.player.stopVideo === "function") {
      this.player.stopVideo();
    }
  }
  
  seekToZero() {
    this.currentTime.set(0);
    if (this.player && this.player.seekTo) {
      this.player.seekTo(0, true);
    }
  }

  seekToLine(offset: number) {
    if (this.player && typeof this.player.seekTo === "function") {
      this.player.seekTo(offset, true);
      const state = this.player.getPlayerState?.();
      // Play if it's paused. State !== 1 means not playing.
      if (state !== 1 && typeof this.player.playVideo === "function") {
        this.player.playVideo();
      }
    }
  }

  toggleFullscreen() {
    if (!isPlatformBrowser(this.platformId)) return;
    const container = document.getElementById("video-wrapper");
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
}
