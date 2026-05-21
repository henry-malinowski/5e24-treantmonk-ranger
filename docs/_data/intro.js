const fs = require("fs");
const path = require("path");
const md = require("markdown-it")({ html: true });
const diffPlugin = require("../scripts/md-diff-plugin");
const heroPlugin = require("../scripts/md-hero-plugin");
md.use(diffPlugin);
md.use(heroPlugin);

let ornamentIndex = 0;

// # h1 → <header class="site-header"><h1 class="site-title">
md.renderer.rules.heading_open = function (tokens, idx) {
  if (tokens[idx].tag === "h1")
    return '<header class="site-header"><h1 class="site-title" style="--intro-order: 0">';
  return md.renderer.renderToken(tokens, idx, md.options);
};
md.renderer.rules.heading_close = function (tokens, idx) {
  if (tokens[idx].tag === "h1") return "</h1></header>\n";
  return md.renderer.renderToken(tokens, idx, md.options);
};

// First paragraph after h1 → <p class="site-subtitle">
md.core.ruler.push("subtitle_flag", (state) => {
  let sawH1 = false;
  for (const token of state.tokens) {
    if (token.type === "heading_open" && token.tag === "h1") {
      sawH1 = true;
      continue;
    }
    if (sawH1 && token.type === "paragraph_open") {
      token.attrSet("class", "site-subtitle");
      token.attrSet("style", "--intro-order: 2");
      break;
    }
  }
});

// --- → ornament divider
md.renderer.rules.hr = function () {
  const order = ornamentIndex * 2 + 1;
  ornamentIndex += 1;
  return `<div class="ornament" style="--intro-order: ${order}"><i class="fa-solid fa-diamond ornament-icon"></i></div>\n`;
};

module.exports = function () {
  ornamentIndex = 0;
  const raw = fs.readFileSync(path.join(__dirname, "intro.md"), "utf8");
  return md.render(raw);
};
