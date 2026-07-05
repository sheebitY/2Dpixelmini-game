// Type-safe event bus for inter-system communication
type Callback = (...args: any[]) => void;

class EventBus {
  private listeners = new Map<string, Set<Callback>>();

  on(event: string, callback: Callback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  once(event: string, callback: Callback): () => void {
    const wrapper: Callback = (...args) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  off(event: string, callback: Callback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();