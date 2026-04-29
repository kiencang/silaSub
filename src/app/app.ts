import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  effect
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";
import { MatIconModule } from "@angular/material/icon";
import { SubtitleService } from "./subtitle.service";
import { VideoService } from "./video.service";
import { FileService } from "./file.service";
import { ToastService } from "./toast.service";
import { StorageService } from "./storage.service";
import { SettingsService } from "./settings.service";
import { SearchService } from "./search.service";
import { PlayerService } from "./player.service";
import { TranslationService } from "./translation.service";
import { AppStateService } from "./app.state.service";

import { SettingsModalComponent } from "./settings-modal.component";
import { FavoritesModalComponent } from "./favorites-modal.component";
import { ToastContainerComponent } from "./toast-container.component";
import { HeaderComponent } from "./header.component";
import { FooterComponent } from "./footer.component";
import { VideoPlayerComponent } from "./video-player.component";
import { ControlPanelComponent } from "./control-panel.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-root",
  imports: [
    RouterOutlet,
    HttpClientModule,
    MatIconModule,
    SettingsModalComponent,
    FavoritesModalComponent,
    ToastContainerComponent,
    HeaderComponent,
    FooterComponent,
    VideoPlayerComponent,
    ControlPanelComponent,
  ],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App implements OnDestroy, OnInit {
  private platformId = inject(PLATFORM_ID);
  private subtitleService = inject(SubtitleService);
  public appState = inject(AppStateService);
  public videoService = inject(VideoService);
  public fileService = inject(FileService);
  public toastService = inject(ToastService);
  public storageService = inject(StorageService);
  public settingsService = inject(SettingsService);
  public searchService = inject(SearchService);
  public playerService = inject(PlayerService);
  public translationService = inject(TranslationService);

  get videoUrl() { return this.appState.videoUrl; }
  get isAnalyzing() { return this.appState.isAnalyzing; }
  get analysisResult() { return this.appState.analysisResult; }
  get analyzeError() { return this.appState.analyzeError; }
  get showInstructions() { return this.appState.showInstructions; }
  get currentLine() { return this.appState.currentLine; }

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const id = this.appState.videoId();
      const ready = this.playerService.isYtReady();

      if (ready) {
        if (id) {
          this.playerService.loadVideo(id);
        } else {
          this.playerService.stopVideo();
        }
      }
    });
  }

  ngOnInit() {
    // Load Settings from LocalStorage
    this.settingsService.loadSettings();
    this.playerService.init();
  }

  ngOnDestroy() {
    this.playerService.destroy();
  }
}
