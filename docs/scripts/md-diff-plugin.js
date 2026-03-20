module.exports = function diffPlugin(md) {
  const DIFF_RE = /^\{([^|}]*)\|([^}]*)\}/;

  // Inline rule: handles single-line {del|add}, {|add}, {del|}
  md.inline.ruler.push("diff_span", function (state, silent) {
    if (state.src.charCodeAt(state.pos) !== 0x7b) return false;

    const match = DIFF_RE.exec(state.src.slice(state.pos));
    if (!match) return false;

    if (!silent) {
      const [, del, add] = match;
      let html = "";
      if (del) html += `<span class="diff-del">${md.renderInline(del)}</span>`;
      if (add) html += `<span class="diff-add">${md.renderInline(add)}</span>`;
      const token = state.push("html_inline", "", 0);
      token.content = html;
    }

    state.pos += match[0].length;
    return true;
  });

  // Block rule: handles multi-line add ({|...\n...\n}) and del ({...\n...\n|}) blocks.
  // Add block: opens with {| (content may follow on the same line), closes with } at end of line.
  // Del block: opens with {  (content must follow on the same line), closes with |} at end of line.
  // If the closer is on the same opening line, the inline rule handles it instead.
  md.block.ruler.before(
    "paragraph",
    "diff_block",
    function (state, startLine, endLine, silent) {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const max = state.eMarks[startLine];
      const line = state.src.slice(pos, max);

      if (line.charCodeAt(0) !== 0x7b) return false;

      const isAdd = line.charCodeAt(1) === 0x7c; // {| → add block
      const closerRE = isAdd ? /\}\s*$/ : /\|\}\s*$/;

      // Same-line closer → inline diff, leave it alone
      if (closerRE.test(line)) return false;

      // Del block: if the opening line has a |...} pattern it's an inline {del|add}
      if (!isAdd) {
        const rest = line.slice(1);
        const pipeIdx = rest.indexOf("|");
        if (pipeIdx !== -1 && rest.indexOf("}", pipeIdx) !== -1) return false;
      }

      // Scan for the closing line
      let closeLineIdx = -1;
      for (let i = startLine + 1; i < endLine; i++) {
        const lPos = state.bMarks[i] + state.tShift[i];
        const lMax = state.eMarks[i];
        if (closerRE.test(state.src.slice(lPos, lMax))) {
          closeLineIdx = i;
          break;
        }
      }
      if (closeLineIdx === -1) return false;
      if (silent) return true;

      const innerLines = [];

      const firstContent = line.slice(isAdd ? 2 : 1);
      if (firstContent.trim()) innerLines.push(firstContent);

      for (let i = startLine + 1; i < closeLineIdx; i++) {
        const lPos = state.bMarks[i] + state.tShift[i];
        const lMax = state.eMarks[i];
        innerLines.push(state.src.slice(lPos, lMax));
      }

      const lastPos = state.bMarks[closeLineIdx] + state.tShift[closeLineIdx];
      const lastMax = state.eMarks[closeLineIdx];
      const lastLine = state.src.slice(lastPos, lastMax);
      const lastContent = isAdd
        ? lastLine.replace(/\}\s*$/, "")
        : lastLine.replace(/\|\}\s*$/, "");
      if (lastContent.trim()) innerLines.push(lastContent);

      const token = state.push("html_block", "", 0);
      token.map = [startLine, closeLineIdx + 1];
      token.content = `<div class="${isAdd ? "diff-add" : "diff-del"} diff-block">\n${md.render(innerLines.join("\n"))}</div>\n`;

      state.line = closeLineIdx + 1;
      return true;
    },
  );
};
