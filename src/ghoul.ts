import { AbstractCreepScreepy, TypedMemory } from './abstract.js';

const role = 'ghoul';

/**
 * Typed memory for a {@link Ghoul}.
 */
export interface GhoulMemory extends TypedMemory<typeof role> {
  /**
   * What object the ghoul should be harvesting from.
   *
   * If omitted, the ghoul's objective is not to be harvesting.
   */
  readonly harvest?: Id<Source>;

  /**
   * What object the ghoul should be transferring into or withdrawing from.
   */
  readonly transfer?: Id<Structure>;

  /**
   * Required.
   */
  readonly role: typeof role;
}

/**
 * Ghouls are a basic worker unit with the capability to work, carry, move.
 */
export class Ghoul extends AbstractCreepScreepy<typeof role, GhoulMemory> {
  /**
   * Assigns the provided creep as a {@link Ghoul} and returns it.
   *
   * @param creep Creep to initialize.
   * @param memory Optional; memory to initialize with.
   * @returns A wrapper around the provided creep.
   */
  static assign(
    creep: Creep,
    memory: GhoulMemory = Ghoul.createMemory(),
  ): Ghoul {
    creep.memory = memory;
    return new Ghoul(creep);
  }

  /**
   * Returns whether the provided creep is in a ghoul role.
   * @param creep
   */
  static isA(creep: Creep): boolean {
    return (creep.memory as GhoulMemory).role === 'ghoul';
  }

  /**
   * Creates and returns a default implementation of memory for a ghoul.
   *
   * @returns New memory instance.
   */
  private static createMemory(): GhoulMemory {
    return {
      role,
    };
  }

  constructor(creep: Creep) {
    super(creep, role);
  }

  override run(): void {
    if (this.isHarvesting) {
      this.runHarvest(this.memory.harvest!);
    } else {
      this.runUpgrade();
    }
  }

  /**
   * Whether this ghoul's current objective is harvesting.
   */
  get isHarvesting(): Boolean {
    return !!this.memory.harvest;
  }

  /**
   * Sets the objective of this ghoul to harvest from a nearby source.
   */
  orderToHarvest(source: Source): void {
    this.memory = {
      harvest: source.id,
      role: 'ghoul',
    };
  }

  /**
   * Sets the objective of this ghoul to upgrade the room controller.
   */
  orderToUpgrade(): void {
    this.memory = {
      role: 'ghoul',
    };
  }

  /**
   * Sets the objective of this ghoul to withdraw or deposit.
   */
  orderToTransfer(container: StructureContainer | StructureSpawn): void {
    this.memory = {
      harvest: this.memory.harvest,
      transfer: container.id,
      role: 'ghoul',
    };
  }

  /**
   * Sets the objective of this ghoul to await further orders.
   */
  orderIdle(): void {
    // TODO: Implement. For now we just keep our current orders/goals.
  }

  /**
   * Runs code to actively harvest from a source and deposit in containers.
   */
  private runHarvest(from: Id<Source>): void {
    if (this.memory.transfer) {
      return this.runTransfer(this.memory.transfer);
    }
    const { object } = this;
    const source = object.room.find(FIND_SOURCES_ACTIVE, {
      filter: (s) => s.id === from,
    })[0];
    if (!source) {
      this.orderIdle();
    } else if (object.harvest(source) === ERR_NOT_IN_RANGE) {
      object.moveTo(source.pos.x, source.pos.y);
    }
  }

  /**
   * Runs code to either withdraw or deposit into a structure.
   *
   * @param to Structure to withdraw or deposit to/from.
   * @returns
   */
  private runTransfer(to: Id<Structure>): void {
    const { object } = this;
    const container = Game.structures[to];
    if (!container) {
      this.orderIdle();
      return;
    }
    if (this.memory.harvest) {
      // Deposit.
      if (object.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        object.moveTo(container.pos.x, container.pos.y);
      }
    } else {
      // Withdraw.
      if (object.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        object.moveTo(container.pos.x, container.pos.y);
      }
    }
  }

  /**
   * Runs code to upgrade the room controller.
   */
  private runUpgrade(): void {
    if (this.memory.transfer) {
      return this.runTransfer(this.memory.transfer);
    }
    const { object } = this;
    const { controller } = object.room;
    if (!controller) {
      this.orderIdle();
      return;
    }
    if (object.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      object.moveTo(controller.pos.x, controller.pos.y);
    }
  }
}
