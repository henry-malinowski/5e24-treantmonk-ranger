import { getCards, getSpells } from "./data.js";
import { makeImgEl } from "./helpers.js";
import {
  closeAllDropdowns,
  makeGDocGroup,
  makeYtGroup,
} from "./linkButtons.js";
import { createModalController } from "./modal.js";
import { createDiffViewController } from "./diffView.js";
import { initSpellTooltips } from "./spellTooltip.js";

const cards = getCards();
initSpellTooltips(getSpells());

let diff;
const modal = createModalController({
  cards,
  makeImgEl,
  makeGDocGroup,
  makeYtGroup,
  closeAllDropdowns,
  onOpen: function () {
    if (diff) diff.reset();
  },
});
diff = createDiffViewController(
  document.getElementById("modal"),
  document.getElementById("diff-toggle"),
);

document.querySelectorAll(".module-card").forEach(function (card) {
  card.addEventListener("mouseenter", function () {
    if (modal.isOpen()) return;
    modal.prefetchCardImage(parseInt(card.dataset.index, 10));
  });

  card.addEventListener("mousedown", function () {
    modal.openModal(parseInt(card.dataset.index, 10));
  });
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    modal.closeModal();
  }

  if (modal.isOpen()) {
    if (e.key === "ArrowLeft") modal.stepModal(-1);
    if (e.key === "ArrowRight") modal.stepModal(1);
  }
});

window.addEventListener("hashchange", function () {
  const hash = location.hash.slice(1).toLowerCase();
  if (!hash) {
    modal.closeModal();
    return;
  }
  const index = modal.getModalIndexByHash(hash);
  if (index !== -1) modal.openModal(index);
});

(function initFromHash() {
  const hash = location.hash.slice(1).toLowerCase();
  if (!hash) return;
  const index = modal.getModalIndexByHash(hash);
  if (index !== -1) modal.openModal(index);
})();

document.addEventListener("click", closeAllDropdowns);

(function initManifestCopy() {
  const input = document.getElementById("manifest-input");
  const btn = document.getElementById("manifest-copy-btn");
  if (!input || !btn) return;

  function selectManifestUrl() {
    input.select();
  }

  input.addEventListener("focus", selectManifestUrl);
  input.addEventListener("click", selectManifestUrl);
  input.addEventListener("mouseup", function (e) {
    e.preventDefault();
  });

  btn.addEventListener("click", function () {
    const text = input.value;

    function onCopied() {
      btn.innerHTML = '<i class="fa-solid fa-check"></i><span>Copied!</span>';
      btn.classList.add("copied");
      setTimeout(function () {
        btn.innerHTML = '<i class="fa-regular fa-copy"></i><span>Copy</span>';
        btn.classList.remove("copied");
      }, 2200);
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(onCopied)
        .catch(function () {
          /* copy failed */
        });
    }
  });
})();
