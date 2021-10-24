import lodash from 'lodash';
import { AbstractScreepy } from './abstract.js';
import { Ghoul } from './ghoul.js';

/**
 * Known role types for rooms to prioritize.
 */
type RoomRoles = undefined;

/**
 * Screepy wrapper around a {@link Room} object.
 *
 * Currently a room is basic coordinator script between various creeps.
 *
 * A room will attempt to (WIP):
 * - Have 2 ghouls harvest from a nearby source into structures with capacity.
 * - Have 2 ghouls upgrade the room controller.
 */
export default class ScreepyRoom extends AbstractScreepy<
  Room,
  RoomRoles,
  {
    role: RoomRoles;
  }
> {
  /**
   * Assigns the provided room as a {@link ScreepyRoom} and returns it.
   *
   * @param room Room to initialize.
   * @returns A wrapper around the provided room.
   */
  static assign(room: Room): ScreepyRoom {
    return new ScreepyRoom(room);
  }

  /**
   * Returns whether the provided room is a {@link ScreepyRoom}.
   *
   * @param room Room to check.
   * @returns
   */
  static isA(_: Room): boolean {
    return true;
  }

  private readonly config = {
    maxHarvestersPerSpawner: 3,
    maxUpgradersPerSpawner: 2,
  };

  constructor(room: Room) {
    super(room, undefined);
  }

  override run(): void {
    // Run ghouls.
    let harvesting = 0;
    let upgrading = 0;
    Object.values(Game.creeps).forEach((c) => {
      if (Ghoul.isA(c)) {
        const ghoul = new Ghoul(c);
        if (ghoul.isHarvesting) {
          harvesting++;
        } else if (ghoul.isUpgrading) {
          upgrading++;
        }
        ghoul.run();
      }
    });

    // Finally, spawn more ghouls.
    const spawner = this.getDefaultSpawner();
    if (!spawner) {
      console.log(`No spawner detected in room: "${this.object.name}""`);
      return;
    }
    if (spawner.spawning) {
      this.object.visual.text(
        `Spawning: ${spawner.spawning.name}`,
        spawner.pos.x,
        spawner.pos.y + 1.1,
        {
          font: 0.3,
          stroke: '#222',
        },
      );
      return;
    }
    if (harvesting < this.config.maxHarvestersPerSpawner) {
      // Create a new harvesting ghoul.
      this.createHarvestingGhoul(spawner);
    } else if (upgrading < this.config.maxUpgradersPerSpawner) {
      // Create a new upgrading ghoul.
      this.createUpgradingGhoul(spawner);
    } else {
      // Report the spawner as idle.
      this.object.visual.text(`Idle`, spawner.pos.x, spawner.pos.y + 1.1, {
        font: 0.3,
        stroke: '#222',
      });
    }
  }

  private getDefaultSpawner(): StructureSpawn | undefined {
    return lodash.sample(Game.spawns);
  }

  private getNextId(spawner: StructureSpawn): number {
    const memory = spawner.memory as { [key: string]: unknown };
    const nextId = (memory.nextId || 1) as number;
    return nextId;
  }

  private incrementId(spawner: StructureSpawn): void {
    const memory = spawner.memory as { [key: string]: unknown };
    const nextId = (memory.nextId || 1) as number;
    memory.nextId = nextId + 1;
  }

  private createHarvestingGhoul(spawner: StructureSpawn): void {
    const harvest = this.object.find(FIND_SOURCES)[0];
    if (harvest) {
      const name = `Ghoul #${this.getNextId(spawner)}`;
      if (
        spawner.spawnCreep([WORK, CARRY, MOVE], name, {
          memory: {
            role: 'ghoul',
            harvest: harvest.id,
          },
        }) === OK
      ) {
        this.incrementId(spawner);
      }
    } else {
      console.log(`No source detected in room: "${this.object.name}"`);
    }
  }

  private createUpgradingGhoul(spawner: StructureSpawn): void {
    const controller = this.object.controller;
    if (controller) {
      const name = `Ghoul #${this.getNextId(spawner)}`;
      if (
        spawner.spawnCreep([WORK, CARRY, MOVE], name, {
          memory: {
            role: 'ghoul',
            goal: 'withdraw',
          },
        }) === OK
      ) {
        this.incrementId(spawner);
      }
    } else {
      console.log(`No controller detected in room: "${this.object.name}"`);
    }
  }

  override toString(): string {
    return `<Room|${this.object.name}>`;
  }
}
