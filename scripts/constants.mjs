export const MODULE_ID = "5e24-treantmonk-ranger";

/**
 * Active effect flag keys for this module.
 * Set on an actor via Active Effects (Mode: Override).
 * Usage: `actor.getFlag(MODULE_ID, FLAGS.xxx)`
 * @enum {string}
 */
export const FLAGS = {
  /**
   * Grants advantage on all attack rolls.
   * @type {string}
   * @see {onPreRollAttackV2} precise-hunter.mjs
   * Active Effect — Mode: Override, Value: `true`
   */
  preciseHunter: "preciseHunter",

  /**
   * Summon Fey is treated as cast 2 spell levels higher,
   * boosting all `@item.level`-scaled stats (AC, HP, attack damage, etc.).
   * @type {string}
   * @see {onPreSummon} fey-reinforcements.mjs
   * Active Effect — Mode: Override, Value: `1`
   */
  feyReinforcements: "feyReinforcements",

  /**
   * Halves exhaustion penalties: D20 roll penalty −1/level (not −2),
   * speed penalty `floor(exhaustion / 2) * 5ft` (not `exhaustion * 5ft`).
   * @type {string}
   * @see {register} tireless.mjs
   * Active Effect — Mode: Override, Value: `true`
   */
  tireless: "tireless",

  /**
   * Primal Companion — companion may be summoned one size larger than the summoner.
   * Applies to all companion types.
   * @type {string}
   * @see {shouldInterceptPrimal} primal-companion.mjs
   * Active Effect — Mode: Override, Value: `true`
   */
  bestialFury: "bestialFury",

  /**
   * Primal Companion — companion may be summoned one size larger than the summoner.
   * Applies only to non-flying companions (Primal Steed feature).
   * @type {string}
   * @see {shouldInterceptPrimal} primal-companion.mjs
   * Active Effect — Mode: Override, Value: `true`
   */
  primalSteed: "primalSteed",
};
