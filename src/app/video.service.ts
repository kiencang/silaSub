import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/,
    );
    return match ? match[1] : null;
  }

  isValidUrl(url: string): boolean {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  getValidUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed.startsWith('http') && trimmed !== '') {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async fetchVideoTitle(videoIdStr: string): Promise<string> {
    let videoTitle = "video-title-not-found";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoIdStr}&format=json`, { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.title) {
          videoTitle = data.title.replace(/[<>:"/\\|?*]/g, '').trim();
        }
      }
    } catch (err) {
      console.warn("Could not fetch video title for export", err);
    }
    return videoTitle;
  }
}
