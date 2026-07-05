import * as PIXI from "pixi.js";

export class DialogBox {
  container: PIXI.Container;
  private bg: PIXI.Graphics;
  private speakerText: PIXI.Text;
  private bodyText: PIXI.Text;
  private hint: PIXI.Text;
  private visible = false;
  private lines: string[] = [];
  private currentLine = 0;
  private speaker = "";
  private onComplete: (() => void) | null = null;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.container = new PIXI.Container();
    this.container.zIndex = 900;
    this.container.visible = false;

    const w = Math.min(canvasWidth * 0.8, 600);
    const h = 120;
    const x = (canvasWidth - w) / 2;
    const y = canvasHeight - h - 20;

    // Background
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(0x1a1a2e, 0.92);
    this.bg.lineStyle(2, 0xffd700);
    this.bg.drawRoundedRect(x, y, w, h, 8);
    this.bg.endFill();
    this.container.addChild(this.bg);

    // Speaker name
    this.speakerText = new PIXI.Text("", {
      fontSize: 14, fill: 0xffd700, fontFamily: "monospace", fontWeight: "bold",
    });
    this.speakerText.position.set(x + 16, y + 10);
    this.container.addChild(this.speakerText);

    // Body text
    this.bodyText = new PIXI.Text("", {
      fontSize: 13, fill: 0xffffff, fontFamily: "monospace",
      wordWrap: true, wordWrapWidth: w - 32,
    });
    this.bodyText.position.set(x + 16, y + 32);
    this.container.addChild(this.bodyText);

    // Hint
    this.hint = new PIXI.Text("[Space/Z] Next", {
      fontSize: 11, fill: 0x888888, fontFamily: "monospace",
    });
    this.hint.anchor.set(1, 1);
    this.hint.position.set(x + w - 16, y + h - 10);
    this.container.addChild(this.hint);
  }

  open(speaker: string, lines: string[], onComplete?: () => void): void {
    this.speaker = speaker;
    this.lines = lines;
    this.currentLine = 0;
    this.onComplete = onComplete ?? null;
    this.showCurrentLine();
    this.container.visible = true;
    this.visible = true;
  }

  isActive(): boolean {
    return this.visible;
  }

  /** Advance to next line or close. Returns true if the dialog was closed. */
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
    this.speakerText.text = this.speaker;
    this.bodyText.text = this.lines[this.currentLine];
    this.hint.text = this.currentLine < this.lines.length - 1 ? "[Space/Z] Next" : "[Space/Z] Close";
  }

  private close(): void {
    this.container.visible = false;
    this.visible = false;
    if (this.onComplete) this.onComplete();
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    const w = Math.min(canvasWidth * 0.8, 600);
    const h = 120;
    const x = (canvasWidth - w) / 2;
    const y = canvasHeight - h - 20;
    this.bg.clear();
    this.bg.beginFill(0x1a1a2e, 0.92);
    this.bg.lineStyle(2, 0xffd700);
    this.bg.drawRoundedRect(x, y, w, h, 8);
    this.bg.endFill();
    this.speakerText.position.set(x + 16, y + 10);
    this.bodyText.position.set(x + 16, y + 32);
    this.bodyText.style.wordWrapWidth = w - 32;
    this.hint.position.set(x + w - 16, y + h - 10);
  }
}
