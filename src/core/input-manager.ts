// Unified keyboard input manager
class InputManager {
  private keys = new Set<string>();
  private justPressed = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);
      // Prevent default for game keys, but allow browser shortcuts (Ctrl+R, F12, etc.)
      const GAME_KEYS = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","KeyZ","KeyX","KeyC","KeyE","KeyB","Digit1","Digit2","Digit3","Digit4","Digit5"];
      if (GAME_KEYS.includes(e.code) && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.justPressed.clear();
    });
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  isKeyJustPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  clearJustPressed(): void {
    this.justPressed.clear();
  }

  getDirection(): { dx: number; dy: number } {
    let dx = 0;
    let dy = 0;
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) dx -= 1;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) dx += 1;
    if (this.keys.has("ArrowUp") || this.keys.has("KeyW")) dy -= 1;
    if (this.keys.has("ArrowDown") || this.keys.has("KeyS")) dy += 1;
    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }
    return { dx, dy };
  }
}

export const input = new InputManager();
