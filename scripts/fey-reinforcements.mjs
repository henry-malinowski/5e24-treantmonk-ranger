// Fey Reinforcements: Summon Fey treated as 2 spell levels higher.
// Flag: flags.5e24-treantmonk-ranger.feyReinforcements (boolean, Override, true)

import { MODULE_ID, FLAGS } from "./constants.mjs";

// Keyed by activity instance; stores whatever getRollData was before we patched it so that
// onPostSummon can restore exactly that (preserving any other module's wrapper in the chain).
const _priorGetRollData = new WeakMap();

/**
 * Hook: `dnd5e.preSummon`
 * When {@link FLAGS.feyReinforcements} is set on the actor, patches `getRollData` on the activity
 * to add 2 to `item.level` for the duration of the summon roll, boosting all `@item.level`-scaled
 * stats on the summoned creature (AC, HP, attack damage, etc.).
 * @param {dnd5e.activities.SummonActivity} activity
 * @param {object} _profile  Selected summon profile (unused).
 * @param {object} _options  Usage options (unused).
 */
export function onPreSummon(activity, _profile, _options) {
  if (activity.parent.identifier !== "summon-fey") return;
  if (!activity.actor?.getFlag(MODULE_ID, FLAGS.feyReinforcements)) return;
  const prior = activity.getRollData.bind(activity);
  _priorGetRollData.set(activity, prior);
  activity.getRollData = function (...args) {
    const data = prior(...args);
    if (data.item?.level !== undefined) data.item.level += 2;
    return data;
  };
}

/**
 * Hook: `dnd5e.postSummon`
 * Restores `getRollData` to whatever it was before {@link onPreSummon} patched it, preserving
 * any other module's wrapper that may have been in the chain. Without this, repeated casts would
 * re-wrap the already-patched method, stacking the +2 level boost on each use.
 * @param {dnd5e.activities.SummonActivity} activity
 * @param {object} _profile   Selected summon profile (unused).
 * @param {object[]} _tokens  Created tokens (unused).
 * @param {object} _options   Usage options (unused).
 */
export function onPostSummon(activity, _profile, _tokens, _options) {
  const prior = _priorGetRollData.get(activity);
  if (!prior) return;
  activity.getRollData = prior;
  _priorGetRollData.delete(activity);
}
