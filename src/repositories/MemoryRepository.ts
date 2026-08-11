import type { Entity, ID } from "@/types/domain";
import type { EntityRepository } from "@/repositories/interfaces";

export class MemoryRepository<T extends Entity> implements EntityRepository<T> {
  private entities: T[] = [];

  findAll(): T[] {
    return this.entities.map((entity) => ({ ...entity }));
  }

  findById(id: ID): T | undefined {
    const entity = this.entities.find((item) => item.id === id);
    return entity ? { ...entity } : undefined;
  }

  create(entity: T): T {
    if (this.entities.some((item) => item.id === entity.id))
      throw new Error(`Entity ${entity.id} already exists`);
    this.entities.push({ ...entity });
    return entity;
  }

  update(id: ID, changes: Partial<T>): T {
    const index = this.entities.findIndex((item) => item.id === id);
    if (index < 0) throw new Error(`Entity ${id} not found`);
    const next = { ...this.entities[index], ...changes, id } as T;
    this.entities[index] = next;
    return { ...next };
  }

  remove(id: ID): void {
    this.entities = this.entities.filter((item) => item.id !== id);
  }

  replaceAll(entities: T[]): void {
    this.entities = entities.map((entity) => ({ ...entity }));
  }

  clear(): void {
    this.entities = [];
  }
}
