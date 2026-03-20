import { MODULE_ID } from "./constants.mjs";
import { onPreSummon, onPostSummon } from "./fey-reinforcements.mjs";
import { onPreRollAttackV2 } from "./precise-hunter.mjs";
import {
  onPreSummonToken,
  register as registerPrimalCompanion,
} from "./primal-companion.mjs";
import { register as registerTireless } from "./tireless.mjs";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "lastVersion", {
    name: "Last Version",
    hint: "The last version checked against to determine whether to show the changelog.",
    scope: "world",
    config: false,
    type: String,
    default: "1.0.0"
  });

  Hooks.on("dnd5e.preRollAttackV2", onPreRollAttackV2);
  Hooks.on("dnd5e.preSummon", onPreSummon);
  Hooks.on("dnd5e.preSummonToken", onPreSummonToken);
  Hooks.on("dnd5e.postSummon", onPostSummon);
});

Hooks.once("ready", async () => {
  const currentVersion = game.modules.get(MODULE_ID).version;
  const lastVersion = game.settings.get(MODULE_ID, "lastVersion");
  if (foundry.utils.isNewerVersion(currentVersion, lastVersion)) {
    const journal = await fromUuid("Compendium.5e24-treantmonk-ranger.content.JournalEntry.ttRangerChangelo");
    const page = journal.pages.contents.at(-1);
    journal.sheet.render(true, { pageId: page.id });
    game.settings.set(MODULE_ID, "lastVersion", currentVersion);
  }
});

Hooks.once("libWrapper.Ready", () => {
  Hooks.once("setup", () => {
    registerTireless();
    registerPrimalCompanion();
  });
});
