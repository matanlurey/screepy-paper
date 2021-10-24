import lodash from 'lodash';
import { Harvester } from './role.harvest.js';

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

  // Spawn harvesters.
  const spawner = lodash.sample(Object.values(Game.spawns));
  if (spawner) {
    const name = `Harvester 0x${Game.time.toString(16)}`;
    spawner.spawnCreep([WORK, CARRY, MOVE], name, {
      memory: Harvester.defaultMemory,
    });
  }

  lodash
    .filter(Object.values(Game.creeps), Harvester.isA)
    .map((c) => new Harvester(c))
    .forEach((c) => c.run());
};
