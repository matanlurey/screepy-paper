import { AbstractScreepy } from './abstract.js';
import { Ghoul, GhoulMemory } from './ghoul.js';
import { UUIDGenerator } from './utils.js';

/**
 * Screepy wrapper around a {@link Room}.
 *
 * Currently a room is a basic coordinator script between various creeps.
 */
export default class ScreepyRoom extends AbstractScreepy<Room> {
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

  /**
   * Creates and wraps a room object.
   *
   * @param room Room to wrap.
   * @param uuid UUID generator.
   */
  constructor(room: Room, private readonly uuid = new UUIDGenerator()) {
    super(room, undefined);
  }

  override run(): void {
    this.optimizeHarvesting();
    this.optimizeUpgrading();
  }

  /**
   * Runs subroutines for harvesting.
   */
  private optimizeHarvesting(): void {
    const harvesters = this.findHarvesters();

    // Increase the harvesting pool if necessary.
    if (harvesters.length < this.determineMaximumHarvesters()) {
      this.increaseHarvesters();
    }

    // Change orders if necessary.
    harvesters.forEach((g) => this.orderHarvester(g));

    // Run internal scripting once received an order.
    harvesters.forEach((g) => g.run());
  }

  /**
   * Runs subroutines for upgrading.
   */
  private optimizeUpgrading(): void {
    const upgraders = this.findUpgraders();

    // Increase the upgrading pool if necessary.
    if (this.findSpawner()?.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      this.increaseUpgraders();
    }

    // Change orders if necessary.
    upgraders.forEach((g) => this.orderUpgrader(g));

    // Run internal scripting once received an order.
    upgraders.forEach((g) => g.run());
  }

  private orderHarvester(ghoul: Ghoul): void {
    if (ghoul.hasEmptyCapacity(RESOURCE_ENERGY)) {
      const source = this.findSourceClosestToSpawner();
      if (source) {
        ghoul.orderToHarvest(source);
      }
    } else if (ghoul.hasFullCapacity(RESOURCE_ENERGY)) {
      const spawner = this.findSpawner();
      if (spawner) {
        ghoul.orderToTransfer(spawner);
      }
    } else {
      // Do not change the goal (continue doing what you're doing).
    }
  }

  private orderUpgrader(ghoul: Ghoul): void {
    if (ghoul.hasEmptyCapacity(RESOURCE_ENERGY)) {
      const spawner = this.findSpawner();
      if (spawner) {
        ghoul.orderToTransfer(spawner);
      }
    } else if (ghoul.hasFullCapacity(RESOURCE_ENERGY)) {
      const source = this.findSourceClosestToSpawner();
      if (source) {
        ghoul.orderToUpgrade();
      }
    } else {
      // Do not change the goal (continue doing what you're doing).
    }
  }

  /**
   * Increases the number of harvesters for a provided source.
   *
   * @param source Target source. Defaults to the one closest to the spawner.
   */
  private increaseHarvesters(source = this.findSourceClosestToSpawner()): void {
    if (!source) {
      return;
    }
    const memory: GhoulMemory = {
      harvest: source.id,
      role: 'ghoul',
    };
    this.findSpawner()?.spawnCreep(
      [WORK, CARRY, MOVE],
      this.uuid.next('Ghoul'),
      {
        memory,
      },
    );
  }

  /**
   * Increases the number of upgraders for the room controller.
   */
  private increaseUpgraders(): void {
    const memory: GhoulMemory = {
      role: 'ghoul',
    };
    this.findSpawner()?.spawnCreep(
      [WORK, CARRY, MOVE],
      this.uuid.next('Ghoul'),
      {
        memory,
      },
    );
  }

  /**
   * Returns the current number of harvesters.
   *
   * @return Number of harvesters.
   */
  private findHarvesters(): Ghoul[] {
    return this.object
      .find(FIND_MY_CREEPS, {
        filter: (c) => Ghoul.isA(c),
      })
      .map((c) => new Ghoul(c))
      .filter((c) => c.isHarvesting);
  }

  /**
   * Returns the current number of upgraders.
   *
   * @return Number of upgraders.
   */
  private findUpgraders(): Ghoul[] {
    return this.object
      .find(FIND_MY_CREEPS, {
        filter: (c) => Ghoul.isA(c),
      })
      .map((c) => new Ghoul(c))
      .filter((c) => !c.isHarvesting);
  }

  /**
   * Returns the maximum number of effective harvesters.
   *
   * This number is computed based on open terrain squares near the **closest**
   * {@link Source}.
   *
   * @param source Source to check, otherwise defaults to the first spawner.
   *
   * @return Number of harvesters.
   */
  private determineMaximumHarvesters(
    source = this.findSourceClosestToSpawner(),
  ): number {
    if (!source) {
      return 0;
    }
    // TODO: Consider more or less based on distance.
    return 2;
  }

  /**
   * Returns the source closest to the spawner in the room, if any.
   *
   * @returns Source, or [[null]] if there is none.
   */
  private findSourceClosestToSpawner(): Source | null {
    const spawner = this.findSpawner();
    return spawner?.pos.findClosestByPath(FIND_SOURCES_ACTIVE) || null;
  }

  /**
   * Returns the current spawner in the room, if any.
   *
   * @return Spawner, or [[null]] if there is none.
   */
  private findSpawner(): StructureSpawn | null {
    return this.object.find(FIND_MY_SPAWNS)[0];
  }
}
