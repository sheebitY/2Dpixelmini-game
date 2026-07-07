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

    this.startBtn.addEventListener("click", () => this.handleStart());
    this.settingsBtn.addEventListener("click", () => this.openSettings());
    this.settingsClose.addEventListener("click", () => this.closeSettings());

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

  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
  //  Settings
  // ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

  private openSettings(): void {
    this.settingsOverlay.style.display = "flex";
    requestAnimationFrame(() => {
      this.settingsOverlay.classList.add("visible");
    });
  }

  private closeSettings(): void {
    this.settingsOverlay.classList.remove("visible");
    setTimeout(() => {
      this.settingsOverlay.style.display = "none";
    }, 300);
  }

  private initSettings(): void {
    // Volume slider
    this.settingsVolume.addEventListener("input", () => {
      this.settingsVolumeVal.textContent = this.settingsVolume.value + "%";
    });

    // Export save
    this.settingsExport.addEventListener("click", () => {
      const data = this.collectSaveData();
      if (!data) return;
      const encoded = encodeSave(data);
      const blob = new Blob([encoded], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pixel-rpg-save.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import save
    this.settingsImport.addEventListener("click", () => {
      this.settingsImportFile.click();
    });
    this.settingsImportFile.addEventListener("change", () => {
      const file = this.settingsImportFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = reader.result as string;
          const decoded = decodeSave(raw);
          const data = JSON.parse(decoded);
          this.applySaveData(data);
          alert("Save imported successfully!");
        } catch {
          alert("Invalid save file.");
        }
      };
      reader.readAsText(file);
      this.settingsImportFile.value = "";
    });

    // Delete save
    this.settingsDelete.addEventListener("click", () => {
      if (confirm("Delete all saved data? This cannot be undone.")) {
        localStorage.removeItem("pixel-rpg-save");
        alert("Save data deleted.");
      }
    });
  }

  private collectSaveData(): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem("pixel-rpg-save");
      if (!raw) { alert("No save data found."); return null; }
      return JSON.parse(raw);
    } catch {
      alert("Failed to read save data.");
      return null;
    }
  }

  private applySaveData(data: Record<string, unknown>): void {
    localStorage.setItem("pixel-rpg-save", JSON.stringify(data));
  }
}

// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T
//  Simple save encoding
//  Base64 + char shift (not real encryption, just obfuscation)
// ¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T

function encodeSave(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  const shifted = json.split("").map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join("");
  return btoa(shifted);
}

function decodeSave(encoded: string): string {
  const shifted = atob(encoded);
  return shifted.split("").map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join("");
}