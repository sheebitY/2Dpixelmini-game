import { input } from "../core/input-manager";

export class DialogBox {
  private overlay: HTMLElement;
  private speakerEl: HTMLElement;
  private bodyEl: HTMLElement;
  private hintEl: HTMLElement;
  private visible = false;
  private lines: string[] = [];
  private currentLine = 0;
  private speaker = "";
  private onComplete: (() => void) | null = null;

  constructor() {
    this.overlay = document.getElementById("dialog-box")!;
    this.speakerEl = document.getElementById("dialog-speaker")!;
    this.bodyEl = document.getElementById("dialog-body")!;
    this.hintEl = document.getElementById("dialog-hint")!;
  }

  open(speaker: string, lines: string[], onComplete?: () => void): void {
    this.speaker = speaker;
    this.lines = lines;
    this.currentLine = 0;
    this.onComplete = onComplete ?? null;
    this.showCurrentLine();
    this.overlay.classList.add("visible");
    this.visible = true;
  }

  isActive(): boolean {
    return this.visible;
  }

  nextOrClose(): boolean {
    this.currentLine++;
    if (this.currentLine >= this.lines.length) {
      this.close();
      return true;
    }
    this.showCurrentLine();
    return false;
  }

  advance(): void {
    this.currentLine++;
    if (this.currentLine >= this.lines.length) {
      this.close();
      return;
    }
    this.showCurrentLine();
  }

  private showCurrentLine(): void {
    this.speakerEl.textContent = this.speaker;
    this.bodyEl.textContent = this.lines[this.currentLine];
    this.hintEl.textContent = this.currentLine < this.lines.length - 1 ? "[Space/Z] Next" : "[Space/Z] Close";
  }

  private close(): void {
    this.overlay.classList.remove("visible");
    this.visible = false;
    if (this.onComplete) this.onComplete();
  }

  resize(): void {
    // No-op: CSS handles positioning
  }
}
