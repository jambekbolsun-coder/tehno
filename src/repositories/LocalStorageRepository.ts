import type { Entity, ID } from "@/types/domain";
import type { EntityRepository, StorageAdapter } from "@/repositories/interfaces";

class BrowserStorageAdapter implements StorageAdapter {
  private readonly memory = new Map<string, string>();

  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return this.memory.get(key) ?? null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      this.memory.set(key, value);
    }
  }

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      this.memory.delete(key);
    }
  }
}

export const browserStorage = new BrowserStorageAdapter();

export class LocalStorageRepository<T extends Entity> implements EntityRepository<T> {
  constructor(
    private readonly key: string,
    private readonly storage: StorageAdapter = browserStorage,
  ) {}

  findAll(): T[] {
    const raw = this.storage.getItem(this.key);
    if (!raw) return [];
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? (value as T[]) : [];
    } catch {
      return [];
    }
  }

  findById(id: ID): T | undefined {
    return this.findAll().find((item) => item.id === id);
  }

  create(entity: T): T {
    const entities = this.findAll();
    if (entities.some((item) => item.id === entity.id)) {
      throw new Error(`Entity ${entity.id} already exists`);
    }
    entities.push(entity);
    this.replaceAll(entities);
    return entity;
  }

  update(id: ID, changes: Partial<T>): T {
    const entities = this.findAll();
    const index = entities.findIndex((item) => item.id === id);
    if (index < 0) throw new Error(`Entity ${id} not found`);
    const next = { ...entities[index], ...changes, id } as T;
    entities[index] = next;
    this.replaceAll(entities);
    return next;
  }

  remove(id: ID): void {
    this.replaceAll(this.findAll().filter((item) => item.id !== id));
  }

  replaceAll(entities: T[]): void {
    this.storage.setItem(this.key, JSON.stringify(entities));
  }

  clear(): void {
    this.storage.removeItem(this.key);
  }
}
