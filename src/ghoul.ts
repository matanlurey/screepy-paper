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

  protected override label(label?: string): void {
    super.label('Ghoul', label, '👻');
  }

  private runUpgrade(): void {
    const creep = this.object;
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.say('Upgrade');
      this.memory.goal = 'upgrade';
    } else if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      creep.say('Withdraw');
      delete this.memory.goal;
    }
    switch (this.memory.goal) {
      case 'upgrade':
        if (
          creep.transfer(creep.room.controller!, RESOURCE_ENERGY) ===
          ERR_NOT_IN_RANGE
        ) {
          creep.moveTo(creep.room.controller!, {
            visualizePathStyle: { stroke: '#33cc55' },
          });
        }
        this.label('Upgrade');
        break;
      default:
        const containers = creep.room.find(FIND_STRUCTURES, {
          filter: (s) => {
            return (
              s.structureType === 'spawn' || s.structureType === 'container'
            );
          },
        }) as StructureContainer[] | StructureSpawn[];
        containers.sort((a, b) => {
          return (
            a.store.getUsedCapacity(RESOURCE_ENERGY) -
            b.store.getUsedCapacity(RESOURCE_ENERGY)
          );
        });
        const container = containers[0];
        if (!container) {
          console.log(`"${creep.name}" lost the will to live (no containers)"`);
          creep.suicide();
          return;
        }
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(container, {
            visualizePathStyle: { stroke: '#cc4433' },
          });
        }
        this.label('Withdraw');
        break;
    }
  }

  private runHarvest(): void {
    const creep = this.object;
    const { memory } = this;
    const spawner = creep.room.find(FIND_STRUCTURES, {
      filter: (s) => s.structureType === 'spawn',
    })[0] as StructureSpawn | undefined;

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      const empty = spawner?.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
      if (empty) {
        memory.goal = 'upgrade';
        creep.say('Upgrade');
      } else {
        memory.goal = 'deposit';
        creep.say('Deposit');
      }
    } else if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      delete memory.goal;
      creep.say('Harvest');
    }

    switch (memory.goal) {
      case 'deposit':
        if (!spawner) {
          console.log(`"${creep.name}" lost the will to live (no spawners)"`);
          creep.suicide();
          return;
        }
        if (creep.transfer(spawner, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(spawner, { visualizePathStyle: { stroke: '#cc4433' } });
        }
        this.label('Deposit');
        break;
      case 'upgrade':
        this.runUpgrade();
        break;
      default:
        const source = creep.room.find(FIND_SOURCES, {
          filter: (s) => s.id === memory.harvest,
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
        break;
    }
  }
}
