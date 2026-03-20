const MARGIN = {
  left: "0 1.5rem 1.25rem 0",
  right: "0 0 1.25rem 1.5rem",
};

// Title format: "left 45% | Credit Name 94% 58%"
//           or: "right 40%"
const HERO_RE =
  /^(left|right)\s+(\d+(?:\.\d+)?%?)(?:\s*\|\s*(.+?)\s+(\d+(?:\.\d+)?%?)\s+(\d+(?:\.\d+)?%?))?$/;

module.exports = function heroPlugin(md) {
  const defaultRender =
    md.renderer.rules.image ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const titleIdx = token.attrIndex("title");
    if (titleIdx === -1) return defaultRender(tokens, idx, options, env, self);

    const match = HERO_RE.exec(token.attrs[titleIdx][1].trim());
    if (!match) return defaultRender(tokens, idx, options, env, self);

    const [, side, rawWidth, creditText, creditBottom, creditRight] = match;
    const width = rawWidth.endsWith("%") ? rawWidth : `${rawWidth}%`;
    const src = md.utils.escapeHtml(token.attrs[token.attrIndex("src")][1]);
    const alt = md.utils.escapeHtml(
      self.renderInlineAsText(token.children, options, env),
    );
    const wrapStyle = `float: ${side}; width: ${width}; margin: ${MARGIN[side]};`;

    if (creditText) {
      return (
        `<div class="modal-inline-hero-wrap" style="${wrapStyle}">` +
        `<img src="${src}" alt="${alt}" class="modal-inline-hero">` +
        `<div class="modal-hero-credit" style="bottom: ${creditBottom}; right: ${creditRight};">${md.utils.escapeHtml(creditText)}</div>` +
        `</div>`
      );
    }

    return `<img src="${src}" alt="${alt}" class="modal-inline-hero" style="${wrapStyle}">`;
  };
};
