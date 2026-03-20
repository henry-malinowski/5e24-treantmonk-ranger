const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const md = require("markdown-it")({ html: true });
const diffPlugin = require("../scripts/md-diff-plugin");
const heroPlugin = require("../scripts/md-hero-plugin");
md.use(diffPlugin);
md.use(heroPlugin);
const { z } = require("zod");

// Render horizontal rules as decorative ornament dividers
md.renderer.rules.hr = function () {
  return '<div class="ornament"><i class="fa-solid fa-diamond ornament-icon"></i></div>\n';
};

// Open all markdown links in a new tab
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  return self.renderToken(tokens, idx, options);
};

const ORDER = [
  "ranger",
  "beast-master",
  "fey-wanderer",
  "gloom-stalker",
  "hunter",
  "spells",
];

const CARDS_DIR = path.join(__dirname, "cards");
const SPELLS_DIR = path.join(CARDS_DIR, "spells");

const YtLinkSchema = z.object({
  label: z.string(),
  url: z.url(),
});

const CardFrontMatterSchema = z.object({
  id: z.string(),
  name: z.string(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  thumbnail: z.string().optional(),
  googleDocsUrl: z.url(),
  ytLinks: z.array(YtLinkSchema).optional(),
  spells: z.array(z.string()).optional(),
});

const SpellSchoolSchema = z.enum([
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation",
]);

const SpellFrontMatterSchema = z.object({
  name: z.string().optional(),
  castingTime: z.string(),
  range: z.string(),
  level: z.coerce.number().int().min(0).max(9).optional(),
  school: SpellSchoolSchema.optional(),
  components: z.string(),
  duration: z.string(),
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSpellsDescriptionHtml(spellsCardData, introHtml) {
  const spellOrder = spellsCardData.spells; // optional array e.g. ['hunters-mark', 'ensnaring-strike']
  let filenames;
  if (Array.isArray(spellOrder) && spellOrder.length > 0) {
    filenames = spellOrder.map((s) => (s.endsWith(".md") ? s : `${s}.md`));
  } else {
    if (!fs.existsSync(SPELLS_DIR)) return introHtml;
    filenames = fs
      .readdirSync(SPELLS_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort();
  }

  const DETAIL_KEYS = [
    { key: "castingTime", label: "Casting Time" },
    { key: "range", label: "Range" },
    { key: "components", label: "Components" },
    { key: "duration", label: "Duration" },
  ];

  const parts = [introHtml];
  for (const file of filenames) {
    const filePath = path.join(SPELLS_DIR, file);
    if (!fs.statSync(filePath).isFile()) continue;
    const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
    const spellData = SpellFrontMatterSchema.parse(data);
    const name = spellData.name ?? path.basename(file, ".md");
    const level =
      spellData.level != null
        ? spellData.level === 0
          ? "Cantrip"
          : `Level ${spellData.level}`
        : "";
    const school = spellData.school ?? "";
    const levelSchool = [level, school].filter(Boolean).join(" ");

    const detailsHtml = DETAIL_KEYS.map(({ key, label }) => {
      const value = spellData[key];
      if (value == null || String(value).trim() === "") return "";
      return `<dt>${escapeHtml(label)}</dt><dd>${md.renderInline(String(value).trim())}</dd>`;
    })
      .filter(Boolean)
      .join("");

    const bodyHtml = content.trim() ? md.render(content) : "";
    const schoolClass = spellData.school
      ? ` spell-school--${spellData.school.toLowerCase()}`
      : "";
    const schoolIcon = spellData.school
      ? `<span class="spell-school-icon" aria-hidden="true"></span>`
      : "";
    parts.push(
      `<div class="spell-entry${schoolClass}">` +
        `<h2 class="spell-title">${escapeHtml(name)}${schoolIcon}</h2>` +
        (levelSchool
          ? `<p class="spell-level-school">${escapeHtml(levelSchool)}</p>`
          : "") +
        (detailsHtml ? `<dl class="spell-details">${detailsHtml}</dl>` : "") +
        (bodyHtml ? `<div class="spell-body">${bodyHtml}</div>` : "") +
        `</div>`,
    );
  }
  return parts.join("");
}

module.exports = function () {
  return ORDER.map((id) => {
    const filePath = path.join(CARDS_DIR, `${id}.md`);
    const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
    const cardData = CardFrontMatterSchema.parse(data);

    if (id === "spells") {
      const introHtml = content.trim() ? md.render(content) : "";
      const descriptionHtml = buildSpellsDescriptionHtml(cardData, introHtml);
      const { spells: _spells, ...rest } = cardData;
      return { ...rest, descriptionHtml };
    }

    return {
      ...cardData,
      descriptionHtml: content.trim() ? md.render(content) : "",
    };
  });
};
