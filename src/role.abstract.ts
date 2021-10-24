import { log } from './utils.js';

export type Roles = 'harvest';

/**
 * Typed memory access for a Creep.
 */
export interface ScreepyMemory<T extends Roles> {
  readonly role: T;
}

/**
 * Typed class for a Creep.
 */
export abstract class Screepy<R extends Roles, T extends ScreepyMemory<R>> {
  /**
   * Creates a new Screepy wrapper.
   *
   * If the provided creep is not of the expected role, an exception is thrown.
   *
   * @param creep Creep to wrap.
   */
  constructor(protected readonly creep: Creep) {
    if (this.memory.role !== this.role()) {
      throw new Error(
        `${this} Unexpected role: "${
          this.memory.role
        }" (expected: "${this.role()}") <${creep.name}`,
      );
    }
  }

  /**
   * Provides typed access to the creep's memory.
   */
  protected get memory(): T {
    return this.creep.memory as T;
  }

  /**
   * Log as this creep.
   *
   * @param rest
   */
  log(...rest: unknown[]): void {
    log(`${this}`, ...rest);
  }

  /**
   * Provides the role expected.
   */
  protected abstract role(): Roles;

  /**
   * Runs the script for this creep.
   */
  abstract run(): void;

  /**
   * Provides a readable name of this creep.
   */
  abstract toString(): string;
}
