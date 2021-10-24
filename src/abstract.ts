/**
 * Typed memory access for an object.
 */
export interface TypedMemory<T> {
  readonly role?: T;
}

/**
 * Typed known object within Screeps.
 */
export abstract class AbstractScreepy<
  O extends { memory: CreepMemory | SpawnMemory | RoomMemory },
  R = typeof undefined,
  M extends TypedMemory<R> = {},
> {
  protected constructor(
    protected readonly object: O,
    private readonly role: R,
  ) {
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

  /**
   * Sets the memory for this object.
   */
  protected set memory(memory: M) {
    this.object.memory = memory;
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

  /**
   * Whether the creep has a completely full capacity of the provided resource.
   * @param resource
   * @returns
   */
  hasFullCapacity(resource: ResourceConstant): boolean {
    return this.object.store.getFreeCapacity(resource) === 0;
  }

  /**
   * Whether the creep has a completely empty capacity of the provided resource.
   * @param resource
   * @returns
   */
  hasEmptyCapacity(resource: ResourceConstant): boolean {
    return this.object.store.getUsedCapacity(resource) === 0;
  }

  /**
   * Returns a structure capable of housing the provided resource.
   *
   * @param resource
   * @returns
   */
  protected findContainerWithCapacity(
    resource: ResourceConstant,
  ): StructureContainer | StructureSpawn | undefined {
    const containers = this.object.room.find(FIND_STRUCTURES, {
      filter: (s) => {
        return s.structureType === 'spawn' || s.structureType === 'container';
      },
    }) as StructureContainer[] | StructureSpawn[];
    containers.sort((a, b) => {
      return (
        (a.store.getUsedCapacity(resource) || 0) -
        (b.store.getUsedCapacity(resource) || 0)
      );
    });
    return containers[0];
  }

  override toString(): string {
    return `${this.memory.role}|#${this.object.id}`;
  }
}
