import { AbstractCreepScreepy, TypedCreepMemory } from './abstract.js';

const role = 'ghoul';

/**
 * Typed memory for a {@see Ghoul}.
 */
interface GhoulMemory extends TypedCreepMemory<typeof role> {
  /**
   * What location the ghoul should be harvesting from.
   *
   * Currently this is assumed to be the ID of a Source.
   *
   * If omitted, the ghoul is assumed to be an upgrading the room controller.
   */
  readonly harvest?: string;

  /**
   * What the goal of this ghoul is, if any.
   */
  goal?: 'deposit' | 'upgrade';
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
   * Creates a default implementation of the memory for a {@link Ghoul}.
   *
   * @return New instance of memory.
   */
  private static createMemory(): GhoulMemory {
    return {
      role,
    };
  }

  constructor(creep: Creep) {
    super(creep, role);
  }

  /**
   * Whether this ghoul is harvesting from a source.
   */
  get isHarvesting(): boolean {
    return !!this.memory.harvest;
  }

  /**
   * Whether this goal is upgrading the room controller.
   */
  get isUpgrading(): boolean {
    return !this.memory.harvest;
  }

  override run(): void {
    if (this.memory.harvest) {
      this.runHarvest();
    } else {
      this.runUpgrade();
    }
  }

  /**
   * Produces a small label describing the unit's current action.
   *
   * Should be the last command used.
   *
   * @param label
   */
  protected override label(label?: string): void {
    super.label('Ghoul', label, '👻');
  }

  /**
   * Runs the Ghoul with a role of upgrading the room controller.
   */
  private runUpgrade(): void {
    const creep = this.object;

    // Potentially switch tasks based on current state.
    if (this.hasFullCapacity(RESOURCE_ENERGY)) {
      creep.say('Upgrade');
      this.memory.goal = 'upgrade';
    } else if (this.hasEmptyCapacity(RESOURCE_ENERGY)) {
      creep.say('Withdraw');
      delete this.memory.goal;
    }

    // Run task.
    switch (this.memory.goal) {
      case 'upgrade':
        return this.runUpgradeGoal();
      default:
        const container = this.findContainerWithCapacity(RESOURCE_ENERGY);
        if (!container) {
          console.log(`"${creep.name}" lost the will to live (no containers)"`);
          creep.suicide();
          return;
        }
        return this.runWithdrawGoal(container);
    }
  }

  /**
   * Moves to and upgrades the room controller.
   */
  private runUpgradeGoal(): void {
    const creep = this.object;
    if (
      creep.transfer(creep.room.controller!, RESOURCE_ENERGY) ===
      ERR_NOT_IN_RANGE
    ) {
      creep.moveTo(creep.room.controller!, {
        visualizePathStyle: { stroke: '#33cc55' },
      });
    }
    this.label('Upgrade');
  }

  /**
   * Moves to and withdraws resources from the provided container.
   *
   * @param container
   */
  private runWithdrawGoal(
    container: StructureSpawn | StructureContainer,
  ): void {
    const creep = this.object;
    if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(container, {
        visualizePathStyle: { stroke: '#cc4433' },
      });
    }
    this.label('Withdraw');
  }

  /**
   * Runs the Ghoul with a role of harvesting resources.
   */
  private runHarvest(): void {
    const creep = this.object;
    const { memory } = this;
    const container = this.findContainerWithCapacity(RESOURCE_ENERGY);

    // Potentially switch tasks based on the current state.
    if (this.hasFullCapacity(RESOURCE_ENERGY)) {
      const empty = container?.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
      if (empty) {
        memory.goal = 'upgrade';
        creep.say('Upgrade');
      } else {
        memory.goal = 'deposit';
        creep.say('Deposit');
      }
    } else if (this.hasEmptyCapacity(RESOURCE_ENERGY)) {
      delete memory.goal;
      creep.say('Harvest');
    }

    // Run task.
    switch (memory.goal) {
      case 'deposit':
        if (!container) {
          console.log(`"${creep.name}" lost the will to live (no containers)"`);
          creep.suicide();
          return;
        }
        return this.runDepositGoal(container);
      case 'upgrade':
        return this.runUpgradeGoal();
      default:
        return this.runHarvestGoal();
    }
  }

  private runDepositGoal(container: StructureContainer | StructureSpawn): void {
    const creep = this.object;
    if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(container, {
        visualizePathStyle: { stroke: '#cc4433' },
      });
    }
    this.label('Deposit');
  }

  private runHarvestGoal(): void {
    const creep = this.object;
    const source = creep.room.find(FIND_SOURCES, {
      filter: (s) => s.id === this.memory.harvest,
    })[0];
    if (!source) {
      console.log(`"${creep.name}" lost the will to live (no sources)`);
      creep.suicide();
      return;
    }
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    this.label('Harvest');
  }
}
