import ScreepyRoom from './room.js';

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
  Object.values(Game.rooms).forEach((r) => new ScreepyRoom(r).run());
};
