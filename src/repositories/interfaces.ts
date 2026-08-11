import type { Entity, ID } from "@/types/domain";

export interface EntityRepository<T extends Entity> {
  findAll(): T[];
  findById(id: ID): T | undefined;
  create(entity: T): T;
  update(id: ID, changes: Partial<T>): T;
  remove(id: ID): void;
  replaceAll(entities: T[]): void;
  clear(): void;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
