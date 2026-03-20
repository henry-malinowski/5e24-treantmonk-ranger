// Precise Hunter: advantage on all attacks.
// Flag: flags.5e24-treantmonk-ranger.preciseHunter (boolean, Override, true)

import { MODULE_ID, FLAGS } from "./constants.mjs";

/**
 * Hook: `dnd5e.preRollAttackV2`
 * Sets advantage on the roll config when {@link FLAGS.preciseHunter} is set on the actor.
 * @param {object} config Roll configuration; `config.advantage` is mutated to `true`.
 * @param {object} _dialog Dialog options (unused).
 * @param {object} _message Message options (unused).
 */
export function onPreRollAttackV2(config, _dialog, _message) {
  if (!config.subject) return;
  const actor = config.subject.actor;
  if (actor?.getFlag(MODULE_ID, FLAGS.preciseHunter)) config.advantage = true;
}
