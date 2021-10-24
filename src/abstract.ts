/**
 * Typed memory access for an object.
 */
export interface TypedMemory<T> {
  readonly role: T;
}

/**
 * Typed known object within Screeps.
 */
export abstract class AbstractScreepy<
  O extends { memory: CreepMemory | SpawnMemory | RoomMemory },
  R,
  M extends TypedMemory<R>,
> {
  protected constructor(protected readonly object: O, role: R) {
    if (this.memory.role !== role) {
      throw new Error(
        `${this}: Expected "${role}"", got "${this.memory.role}"`,
      );
    }
  }

  /**
   * Returns the memory for this object typed as `M`.
   */
  protected get memory(): M {
    return this.object.memory as M;
  }

  /** Runs scripts associated with this object. */
  abstract run(): void;
}

/**
 * Typed memory access for a creep.
 */
export interface TypedCreepMemory<
  T extends 'ghoul' | undefined = 'ghoul' | undefined,
> extends TypedMemory<T> {}

/**
 * Typed known creep within Screeps.
 */
export abstract class AbstractCreepScreepy<
  R,
  M extends TypedMemory<R>,
> extends AbstractScreepy<Creep, R, M> {
  /**
   * Returns whether the provided creep is considered "new" (no role).
   * @param creep Creep to check.
   * @returns
   */
  static isNew(creep: Creep): boolean {
    return (creep.memory as TypedCreepMemory).role === undefined;
  }

  /**
   * Renders a label above and below the creep.
   * @param name Above label.
   * @param description Below label, optional.
   */
  protected label(name: string, description?: string, icon?: string): void {
    const { visual } = this.object.room;
    const { x, y } = this.object.pos;
    visual.text(name, x, y - 0.5, {
      font: 0.3,
      stroke: '#222',
    });
    if (description) {
      visual.text(description.toUpperCase(), x, y + 0.5, {
        font: 0.15,
        stroke: '#222',
      });
    }
    if (icon) {
      visual.text(icon, x, y + 0.15, { font: 0.5 });
    }
  }

  override toString(): string {
    return `${this.memory.role}|#${this.object.id}`;
  }
}