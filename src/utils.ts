/**
 * Helper class to generate unique names (IDs) for units.
 */
export class UUIDGenerator {
  /**
   * Creates a new instance of the {@link UUIDGenerator}.
   *
   * @param game Optional, otherwise defaults to the global {@link Game} object.
   */
  constructor(private readonly game: Game = Game) {}

  /**
   * Given the provided prefix, returns a unique name (hash key).
   *
   * @param prefix Canonical name of the object, such as [[Ghoul]].
   */
  next(prefix: string): string {
    let attempt = 0;
    while (this.game.creeps[`${prefix} #${++attempt}`]);
    return `${prefix} #${attempt}`;
  }
}
