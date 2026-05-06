import { Injectable, signal, computed, inject } from '@angular/core';
import { TranscriptLine } from './subtitle.service';
import { VideoService } from './video.service';
import { PlayerService } from './player.service';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private videoService = inject(VideoService);
  private playerService = inject(PlayerService);

  videoUrl = signal("");
  
  isAnalyzing = signal(false);
  analysisResult = signal<{
    lines: number;
    transcript: TranscriptLine[];
  } | null>(null);
  analyzeError = signal<string | null>(null);

  // Auto-scroll state
  isTranscriptHovered = signal(false);
  isTranscriptExpanded = signal(false);
  showEnglishSubtitle = signal(true);
  isDevMode = signal(false);

  // Instructions
  showInstructions = signal(false);
  isShareModalOpen = signal(false);

  videoId = computed(() => {
    return this.videoService.extractYouTubeId(this.videoUrl());
  });

  currentLine = computed(() => {
    const res = this.analysisResult();
    if (!res || !res.transcript) return null;
    const t = this.playerService.currentTime();

    // Find the line that matches current time
    return (
      res.transcript.find(
        (line) => t >= line.offset && t <= line.offset + line.duration,
      ) || null
    );
  });

  subtitleSpeedInfo = computed(() => {
    const res = this.analysisResult();
    if (!res || !res.transcript) return null;
    
    let totalWords = 0;
    let totalDurationSec = 0;

    for (const line of res.transcript) {
      if (line.viText) {
        const words = line.viText.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (words > 0) {
          totalWords += words;
          totalDurationSec += line.duration;
        }
      }
    }

    if (totalDurationSec === 0) return null;

    const totalDurationMin = totalDurationSec / 60;
    const speed = totalWords / totalDurationMin;
    const STANDARD_SPEED = 200;
    const THRESHOLD = 220;

    if (speed > THRESHOLD) {
      const excessPercent = Math.round(((speed / STANDARD_SPEED) - 1) * 100);
      return { speed, excessPercent };
    }
    return null;
  });
}
