import type { ComponentMap, ComponentType } from "./components";

export type EntityId = number;

export class EntityManager {
  private nextId = 1;
  private entities = new Set<EntityId>();
  private components = new Map<string, Map<EntityId, any>>();

  createEntity(): EntityId {
    const id = this.nextId++;
    this.entities.add(id);
    return id;
  }

  destroyEntity(id: EntityId): void {
    this.entities.delete(id);
    for (const store of this.components.values()) {
      store.delete(id);
    }
  }

  addComponent<K extends ComponentType>(id: EntityId, type: K, data: ComponentMap[K]): void {
    if (!this.components.has(type)) {
      this.components.set(type, new Map());
    }
    this.components.get(type)!.set(id, data);
  }

  getComponent<K extends ComponentType>(id: EntityId, type: K): ComponentMap[K] | undefined {
    return this.components.get(type)?.get(id) as ComponentMap[K] | undefined;
  }

  removeComponent(id: EntityId, type: ComponentType): void {
    this.components.get(type)?.delete(id);
  }

  hasComponent(id: EntityId, type: ComponentType): boolean {
    return this.components.get(type)?.has(id) ?? false;
  }

  query(...types: ComponentType[]): EntityId[] {
    const result: EntityId[] = [];
    for (const id of this.entities) {
      if (types.every((t) => this.hasComponent(id, t))) {
        result.push(id);
      }
    }
    return result;
  }

  get allEntities(): Set<EntityId> {
    return this.entities;
  }

  clear(): void {
    this.entities.clear();
    this.components.clear();
    this.nextId = 1;
  }
}

export const entities = new EntityManager();