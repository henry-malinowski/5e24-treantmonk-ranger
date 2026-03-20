// Tireless: halve exhaustion penalties.
// Flag: flags.5e24-treantmonk-ranger.tireless (boolean, Override, true)
//
// D20 tests: reduces roll penalty from -2/level to -1/level.
// Speed:     reduces speed penalty from (exhaustion * 5ft) to (floor(exhaustion/2) * 5ft).

import { MODULE_ID, FLAGS } from "./constants.mjs";

/**
 * Registers libWrapper patches for the Tireless feature.
 * @see Actor5e#addRollExhaustion dnd5e/module/documents/actor/actor.mjs
 * @see Actor5e#prepareDerivedData dnd5e/module/documents/actor/actor.mjs
 */
export function register() {
  // Halve the D20 roll penalty injected by addRollExhaustion.
  // data.exhaustion is set to -(level * 2); multiplying by 0.5 yields -(level * 1).
  libWrapper.register(
    MODULE_ID,
    "CONFIG.Actor.documentClass.prototype.addRollExhaustion",
    function (wrapped, parts, data) {
      wrapped(parts, data);
      if (data.exhaustion && this.getFlag(MODULE_ID, FLAGS.tireless)) {
        data.exhaustion *= 0.5;
      }
    },
    "WRAPPER",
  );

  // Restore the difference between full and halved speed reduction.
  // prepareMovement subtracts (exhaustion * reductionPerLevel) from each movement type;
  // adding back ceil(exhaustion/2) * reductionPerLevel, and leaving floor(exhaustion/2) * reductionPerLevel.
  libWrapper.register(
    MODULE_ID,
    "CONFIG.Actor.documentClass.prototype.prepareDerivedData",
    function (wrapped, ...args) {
      wrapped(...args);
      if (!this.getFlag(MODULE_ID, FLAGS.tireless)) return;
      const exhaustion = this.system.attributes.exhaustion;
      if (!exhaustion) return;
      const movement = this.system.attributes.movement;
      const addBack = dnd5e.utils.convertLength(
        Math.ceil(exhaustion / 2) *
          CONFIG.DND5E.conditionTypes.exhaustion.reduction.speed,
        CONFIG.DND5E.defaultUnits.length.imperial,
        movement.units,
      );
      for (const type of Object.keys(CONFIG.DND5E.movementTypes)) {
        if (movement[type] > 0) movement[type] += addBack;
      }
      movement.speed = movement.walk;
      movement.max = Object.keys(CONFIG.DND5E.movementTypes).reduce(
        (m, t) => Math.max(m, movement[t] ?? 0),
        0,
      );
    },
    "WRAPPER",
  );
}
