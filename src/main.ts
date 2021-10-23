import lodash from 'lodash';

interface ScreepyCreep extends Creep {
  memory: {
    role: 'harvester';
  };
}

const globalConfig = {
  maxHarvesters: 2,
};

function mapErrors(errorCode: number) {
  switch (errorCode) {
    case OK:
      return 'OK';
    case ERR_NOT_OWNER:
      return 'ERR_NOT_OWNER';
    case ERR_NAME_EXISTS:
      return 'ERR_NAME_EXISTS';
    case ERR_BUSY:
      return 'ERR_BUSY';
    case ERR_NOT_ENOUGH_ENERGY:
      return 'ERR_NOT_ENOUGH_ENERGY';
    case ERR_NOT_IN_RANGE:
      return 'ERR_NOT_IN_RANGE';
    case ERR_INVALID_ARGS:
      return 'ERR_INVALID_ARGS';
    case ERR_RCL_NOT_ENOUGH:
      return 'ERR_RCL_NOT_ENOUGH';
    default:
      return `UNKNOWN: ${errorCode}`;
  }
}

export const loop = () => {
  // Garbage collection (non-existing creeps).
  Object.keys(Memory.creeps).forEach((c) => {
    if (!(c in Game.creeps)) {
      delete Memory.creeps[c];
      console.log(
        'GC',
        'Non-existent creep',
        c,
        `${JSON.stringify(c).length} bytes`,
      );
    }
  });

  // Creep loop.
  const harvesters = lodash.filter(
    Object.values(Game.creeps),
    (c) => (c as ScreepyCreep).memory.role === 'harvester',
  );

  // Spawn harvesters.
  if (harvesters.length < globalConfig.maxHarvesters) {
    const spawner = lodash.sample(Object.values(Game.spawns));
    if (spawner) {
      const name = `Harvester 0x${Game.time.toString(16)}`;
      const result = spawner.spawnCreep([WORK, CARRY, MOVE], name, {
        memory: { role: 'harvester' },
      });
      if (result === 0) {
        console.log('Spawning', name, result);
      } else {
        spawner.room.visual.text(
          `🚫: ${mapErrors(result)}`,
          spawner.pos.x + 1,
          spawner.pos.y + 1,
          { align: 'left', opacity: 0.8, color: 'red', font: 0.5 },
        );
      }
    }
  }

  // Spawn notifications.
  Object.values(Game.spawns).forEach((s) => {
    if (s.spawning) {
      const creep = Game.creeps[s.spawning.name] as ScreepyCreep;
      s.room.visual.text(
        `🛠️: ${creep.name} (${creep.memory.role})`,
        s.pos.x + 1,
        s.pos.y,
        { align: 'left', opacity: 0.8 },
      );
    }
  });

  // Order harvester/upgrade combo unit (inefficient).
  harvesters.forEach((h) => {
    const creep = h as ScreepyCreep;
    if (creep.store.getFreeCapacity() > 0) {
      const source = creep.room.find(FIND_SOURCES)[0];
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    } else {
      const target = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => {
          s.structureType === STRUCTURE_SPAWN &&
            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        },
      })[0];
      if (
        target &&
        creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
      ) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#fff' } });
      } else if (creep.room.controller) {
        if (
          creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE
        ) {
          creep.moveTo(creep.room.controller, {
            visualizePathStyle: { stroke: '#fff' },
          });
        }
      }
    }
  });
};
