import { exportSaveToFile, importSaveFromFile, deleteSave } from "../core/save-manager";
import { audioManager } from "../core/audio-manager";

export type LoadStatus = "idle" | "loading" | "done";

export class TitleScreen {
  private overlay: HTMLElement;
  private startBtn: HTMLElement;
  private settingsBtn: HTMLElement;
  private loadingOverlay: HTMLElement;
  private loadingBar: HTMLElement;
  private loadingText: HTMLElement;

  // Settings panel
  private settingsOverlay: HTMLElement;
  private settingsClose: HTMLElement;
  private settingsVolume: HTMLInputElement;
  private settingsVolumeVal: HTMLElement;
  private settingsExport: HTMLElement;
  private settingsImport: HTMLElement;
  private settingsImportFile: HTMLInputElement;
  private settingsDelete: HTMLElement;
  private tutorialBtn: HTMLElement;
  private tutorialOverlay: HTMLElement;
  private tutorialClose: HTMLElement;

  private onStartCb: (() => void) | null = null;
  private loadStatus: LoadStatus = "idle";

  constructor() {
    this.overlay = document.getElementById("title-screen")!;
    this.startBtn = document.getElementById("title-start-btn")!;
    this.settingsBtn = document.getElementById("title-settings-btn")!;
    this.loadingOverlay = document.getElementById("title-loading-overlay")!;
    this.loadingBar = document.getElementById("title-loading-bar")!;
    this.loadingText = document.getElementById("title-loading-text")!;

    // Settings
    this.settingsOverlay = document.getElementById("settings-overlay")!;
    this.settingsClose = document.getElementById("settings-close")!;
    this.settingsVolume = document.getElementById("settings-volume") as HTMLInputElement;
    this.settingsVolumeVal = document.getElementById("settings-volume-val")!;
    this.settingsExport = document.getElementById("settings-export")!;
    this.settingsImport = document.getElementById("settings-import")!;
    this.settingsImportFile = document.getElementById("settings-import-file") as HTMLInputElement;
    this.settingsDelete = document.getElementById("settings-delete")!;
    this.tutorialBtn = document.getElementById("settings-tutorial")!;
    this.tutorialOverlay = document.getElementById("tutorial-overlay")!;
    this.tutorialClose = document.getElementById("tutorial-close")!;

    this.startBtn.addEventListener("click", () => this.handleStart());
    this.settingsBtn.addEventListener("click", () => this.openSettings());
    this.settingsClose.addEventListener("click", () => this.closeSettings());

    this.tutorialBtn.addEventListener("click", () => this.openTutorial());
    this.tutorialClose.addEventListener("click", () => this.closeTutorial());
    // ESC: close overlays from title screen
    window.addEventListener("keydown", (e) => {
      if (e.code !== "Escape") return;
      if (this.tutorialOverlay.style.display === "flex") {
        this.closeTutorial();
        return;
      }
      if (this.settingsOverlay.style.display === "flex") {
        this.closeSettings();
      }
    });

    this.initSettings();
  }

  show(): void {
    this.overlay.style.display = "flex";
    requestAnimationFrame(() => {
      this.overlay.classList.add("visible");
    });
  }

  hide(): void {
    this.overlay.classList.remove("visible");
    setTimeout(() => {
      this.overlay.style.display = "none";
    }, 500);
  }

  setOnStart(cb: () => void): void {
    this.onStartCb = cb;
  }

  setLoadProgress(progress: number): void {
    const pct = Math.min(1, Math.max(0, progress));
    this.loadingBar.style.width = (pct * 100) + "%";
  }

  setLoadDone(): void {
    this.loadStatus = "done";
    this.loadingBar.style.width = "100%";
    this.loadingText.textContent = "Ready!";
    this.startBtn.classList.add("ready");

    if (this.loadingOverlay.style.display === "flex") {
      setTimeout(() => {
        this.loadingOverlay.classList.remove("visible");
        setTimeout(() => {
          this.loadingOverlay.style.display = "none";
          this.hide();
          setTimeout(() => this.onStartCb?.(), 500);
        }, 400);
      }, 400);
    }
  }

  private handleStart(): void {
    if (this.loadStatus === "loading") return;

    if (this.loadStatus === "done") {
      this.hide();
      setTimeout(() => this.onStartCb?.(), 500);
    } else {
      this.loadingOverlay.style.display = "flex";
      requestAnimationFrame(() => {
        this.loadingOverlay.classList.add("visible");
      });
      this.loadStatus = "loading";
      this.loadingText.textContent = "Loading assets...";
    }
  }

  // �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T
  //  Settings
  // �T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T�T

  openTutorial(): void {
    this.settingsOverlay.style.display = "none";
    this.tutorialOverlay.style.display = "flex";
    requestAnimationFrame(() => this.tutorialOverlay.classList.add("visible"));
  }

  closeTutorial(): void {
    this.tutorialOverlay.classList.remove("visible");
    setTimeout(() => {
      this.tutorialOverlay.style.display = "none";
      this.settingsOverlay.style.display = "flex";
      requestAnimationFrame(() => this.settingsOverlay.classList.add("visible"));
    }, 300);
  }

  openSettings(): void {
    this.settingsOverlay.style.display = "flex";
    requestAnimationFrame(() => {
      this.settingsOverlay.classList.add("visible");
    });
  }

  closeSettings(): void {
    this.settingsOverlay.classList.remove("visible");
    setTimeout(() => {
      this.settingsOverlay.style.display = "none";
    }, 300);
  }

  private initSettings(): void {
    // Volume slider
    this.settingsVolume.addEventListener("input", () => {
      audioManager.volume = parseInt(this.settingsVolume.value) / 100;
      this.settingsVolumeVal.textContent = this.settingsVolume.value + "%";
    });

    // Export save
    this.settingsExport.addEventListener("click", () => {
      if (!exportSaveToFile()) { alert("\u5bfc\u51fa\u5b58\u6863\u5931\u8d25\u3002"); }
    });

    // Import save
    this.settingsImport.addEventListener("click", () => {
      this.settingsImportFile.click();
    });
    this.settingsImportFile.addEventListener("change", async () => {
      const file = this.settingsImportFile.files?.[0];
      if (!file) return;
      const ok = await importSaveFromFile(file);
      this.settingsImportFile.value = "";
      if (ok) {
        // Reload so loadAssets() picks up the imported save
        location.reload();
      } else {
        alert("\u65e0\u6548\u7684\u5b58\u6863\u6587\u4ef6\u3002");
      }
    });

    // Delete save
    this.settingsDelete.addEventListener("click", () => {
      if (confirm("\u786e\u5b9a\u5220\u9664\u6240\u6709\u5b58\u6863\u6570\u636e\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002")) {
        deleteSave();
        alert("\u5b58\u6863\u5df2\u5220\u9664\u3002");
      }
    });
  }
}