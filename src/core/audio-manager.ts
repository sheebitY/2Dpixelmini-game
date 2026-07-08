class AudioManager {
  private bgm: HTMLAudioElement;
  private _volume = 0.1;

  constructor() {
    this.bgm = new Audio("/assets/audio/bgm/bgm.mp3");
    this.bgm.loop = true;
    this.bgm.volume = this._volume;
  }

  get volume(): number { return this._volume; }
  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    this.bgm.volume = this._volume;
  }

  playBGM(): void {
    this.bgm.currentTime = 0;
    this.bgm.play().catch(() => {});
  }

  stopBGM(): void {
    this.bgm.pause();
    this.bgm.currentTime = 0;
  }
}

export const audioManager = new AudioManager();
