const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const md = require("markdown-it")({ html: true });
const heroPlugin = require("../scripts/md-hero-plugin");
md.use(heroPlugin);
const { z } = require("zod");

// Match the hr renderer from cards.js for consistent output
md.renderer.rules.hr = function () {
  return '<div class="ornament"><i class="fa-solid fa-diamond ornament-icon"></i></div>\n';
};

// Open all markdown links in a new tab
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  return self.renderToken(tokens, idx, options);
};

const SPELLS_DIR = path.join(__dirname, "cards", "spells");

const SpellFrontMatterSchema = z.object({
  name: z.string().optional(),
  castingTime: z.string(),
  range: z.string(),
  level: z.coerce.number().int().min(0).max(9).optional(),
  school: z
    .enum([
      "Abjuration",
      "Conjuration",
      "Divination",
      "Enchantment",
      "Evocation",
      "Illusion",
      "Necromancy",
      "Transmutation",
    ])
    .optional(),
  components: z.string(),
  duration: z.string(),
});

function stripDiff(str) {
  return str.replace(/\{([^|]*)\|([^}]*)\}/g, "$2");
}

module.exports = function () {
  if (!fs.existsSync(SPELLS_DIR)) return {};

  const result = {};
  const files = fs.readdirSync(SPELLS_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const slug = path.basename(file, ".md");
    const { data, content } = matter(
      fs.readFileSync(path.join(SPELLS_DIR, file), "utf8"),
    );
    const spell = SpellFrontMatterSchema.parse(data);
    const name = spell.name ?? slug;
    const level =
      spell.level != null
        ? spell.level === 0
          ? "Cantrip"
          : `Level ${spell.level}`
        : "";
    const school = spell.school ?? "";

    result[slug] = {
      name,
      castingTime: stripDiff(spell.castingTime),
      range: stripDiff(spell.range),
      components: stripDiff(spell.components),
      duration: stripDiff(spell.duration),
      level: spell.level ?? null,
      levelSchool: [level, school].filter(Boolean).join(" "),
      school: spell.school ?? null,
      bodyHtml: content.trim() ? md.render(stripDiff(content)) : "",
    };
  }

  return result;
};
