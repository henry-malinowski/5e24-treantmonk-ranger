// Primal Companion / Exceptional Training: size selection on summon.
// Flags: flags.5e24-treantmonk-ranger.bestialFury (companion can be one size larger than summoner)
//        flags.5e24-treantmonk-ranger.primalSteed (same, but only for non-flying companions)

import { MODULE_ID, FLAGS } from "./constants.mjs";

// Ordered size keys from smallest to largest (matches CONFIG.DND5E.actorSizes numerical values)
const SIZE_ORDER = ["tiny", "sm", "med", "lg", "huge", "grg"];

function nextSize(sizeKey) {
  const idx = SIZE_ORDER.indexOf(sizeKey);
  if (idx < 0) return null;
  return SIZE_ORDER[Math.min(idx + 1, SIZE_ORDER.length - 1)];
}

/**
 * Returns `true` if this activity qualifies for Primal Companion size-selection behaviour:
 * actor has {@link FLAGS.bestialFury} or {@link FLAGS.primalSteed}.
 * The fly-speed exclusion for primalSteed is checked later once the actor is loaded.
 * @param {dnd5e.activities.SummonActivity} activity
 * @returns {boolean}
 */
function shouldInterceptPrimal(activity) {
  if (activity.parent.identifier !== "primal-companion") return false;
  const actor = activity.actor;
  return !!(
    actor?.getFlag(MODULE_ID, FLAGS.bestialFury) ||
    actor?.getFlag(MODULE_ID, FLAGS.primalSteed)
  );
}

/**
 * Hook: `dnd5e.preSummonToken`
 * Applies the size chosen in the usage dialog to each token before it is created.
 * @param {dnd5e.activities.SummonActivity} activity
 * @param {object} profile Summon profile for this token.
 * @param {object} tokenUpdateData Mutable update data; `.actorUpdates` and `.tokenUpdates` are written.
 * @param {object} options Usage options; `options.creatureSize` carries the chosen size key.
 */
export function onPreSummonToken(activity, profile, tokenUpdateData, options) {
  if (!options.creatureSize) return;
  if (!shouldInterceptPrimal(activity)) return;
  // primalSteed: don't apply size to flying companions
  if (
    activity.actor?.getFlag(MODULE_ID, FLAGS.primalSteed) &&
    !activity.actor?.getFlag(MODULE_ID, FLAGS.bestialFury)
  ) {
    const summonActor = profile.uuid ? fromUuidSync(profile.uuid) : null;
    if (summonActor?.system.attributes.movement.fly) return;
  }
  const config = CONFIG.DND5E.actorSizes[options.creatureSize];
  if (!config?.token) {
    console.error(
      `5e24-treantmonk-ranger | primal-companion: size "${options.creatureSize}" missing from CONFIG.DND5E.actorSizes — token dimensions not applied`,
    );
    return;
  }
  tokenUpdateData.actorUpdates["system.traits.size"] = options.creatureSize;
  tokenUpdateData.tokenUpdates.width = config.token;
  tokenUpdateData.tokenUpdates.height = config.token;
}

/**
 * Registers the libWrapper patch that injects a size selector into the summon usage dialog
 * for qualifying Primal Companion uses.
 * @see SummonUsageDialog#_prepareCreationContext  dnd5e/module/applications/activity/summon-usage-dialog.mjs
 */
export function register() {
  libWrapper.register(
    MODULE_ID,
    "dnd5e.applications.activity.SummonUsageDialog.prototype._prepareCreationContext",
    async function (wrapped, context, options) {
      context = await wrapped(context, options);

      if (!this.config.create?.summons) return context;

      const activity = this.activity;
      const profiles = activity.profiles;
      const selectedId = this.config.summons?.profile;
      const profile = selectedId
        ? profiles.find((p) => p._id === selectedId)
        : profiles[0];

      if (!profile || !shouldInterceptPrimal(activity)) return context;

      const summonActor = await fromUuid(profile.uuid);
      const creatureSize = summonActor.system.traits.size;
      const summonerSize = activity.actor.system.traits.size;

      // primalSteed: exclude flying companions from size upgrade
      if (
        activity.actor.getFlag(MODULE_ID, FLAGS.primalSteed) &&
        !activity.actor.getFlag(MODULE_ID, FLAGS.bestialFury) &&
        summonActor.system.attributes.movement.fly
      )
        return context;

      const enhancedSize = nextSize(summonerSize);
      if (!enhancedSize || enhancedSize === creatureSize) return context;

      const sizeOptions = [creatureSize, enhancedSize].map((s) => ({
        value: s,
        label: game.i18n.localize(CONFIG.DND5E.actorSizes[s]?.label ?? s),
      }));
      const storedSize = this.config.summons?.creatureSize;
      const sizeField = {
        field: new foundry.data.fields.StringField({
          required: true,
          blank: false,
          label: game.i18n.localize("DND5E.Size"),
        }),
        name: "summons.creatureSize",
        // Only keep stored value if it's valid for this profile; otherwise default to base size.
        value: sizeOptions.some((o) => o.value === storedSize)
          ? storedSize
          : creatureSize,
        options: sizeOptions,
      };

      context.hasCreation = true;
      context.summonsFields ??= [];
      const existingIdx = context.summonsFields.findIndex(
        (f) => f.name === "summons.creatureSize",
      );
      if (existingIdx >= 0) context.summonsFields[existingIdx] = sizeField;
      else context.summonsFields.push(sizeField);

      return context;
    },
    "WRAPPER",
  );
}
