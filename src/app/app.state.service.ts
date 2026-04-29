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

  // Instructions
  showInstructions = signal(false);

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
}
