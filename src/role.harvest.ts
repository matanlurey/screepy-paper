import { Roles, Screepy, ScreepyMemory } from './role.abstract.js';

interface HarvesterMemory extends ScreepyMemory<'harvest'> {
  goal: 'harvest' | 'upgrade' | 'refuel';
}

export class Harvester extends Screepy<'harvest', HarvesterMemory> {
  static readonly defaultMemory: HarvesterMemory = {
    goal: 'harvest',
    role: 'harvest',
  };

  static isA(creep: Creep): boolean {
    return (creep.memory as { [key: string]: unknown }).role === 'harvest';
  }

  constructor(creep: Creep) {
    super(creep);
  }

  protected override role(): Roles {
    return 'harvest';
  }

  override run(): void {
    this.switchGoals();
    switch (this.memory.goal) {
      case 'harvest':
        this.runHarvest();
        break;
      case 'upgrade':
        this.runUpgrade();
        break;
      case 'refuel':
        this.runRefuel();
        break;
    }
    const { creep } = this;
    creep.room.visual.text(`Harvester`, creep.pos.x, creep.pos.y - 0.5, {
      stroke: '#333',
      font: 0.35,
    });
    creep.room.visual.text(
      this.memory.goal.toUpperCase(),
      creep.pos.x,
      creep.pos.y + 0.5,
      {
        font: 0.2,
        color: '#eee',
        stroke: '#222',
      },
    );
  }

  private switchGoals(): void {
    const { creep } = this;
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      this.memory.goal = 'harvest';
    } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      const structure = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => s.structureType === 'spawn',
      })[0] as StructureSpawn | null;
      if (!structure) {
        this.log(`No structures found`);
        return;
      }
      const { store } = structure;
      const energy =
        store.getFreeCapacity(RESOURCE_ENERGY) /
        store.getCapacity(RESOURCE_ENERGY);
      this.memory.goal = energy > 0.5 ? 'refuel' : 'upgrade';
    }
  }

  private runHarvest(): void {
    const { creep } = this;
    const source = creep.room.find(FIND_SOURCES)[0];
    if (!source) {
      this.log(`No sources found`);
      return;
    }
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
  }

  private runUpgrade(): void {
    const { creep } = this;
    if (!creep.room.controller) {
      this.log(`No room controllers found`);
      return;
    }
    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller, {
        visualizePathStyle: { stroke: '#fff' },
      });
    }
  }

  private runRefuel(): void {
    const { creep } = this;
    const structure = creep.room.find(FIND_STRUCTURES, {
      filter: (s) => s.structureType === 'spawn',
    })[0];
    if (!structure) {
      this.log(`No structures found`);
      return;
    }
    if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(structure, { visualizePathStyle: { stroke: '#cc4433' } });
    }
  }

  override toString(): string {
    return `<${this.creep.name}#${this.creep.id}>`;
  }
}
