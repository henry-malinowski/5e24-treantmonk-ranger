/**
 * Spell tooltip — shows stat block on hover (.spell-ref[data-spell="<slug>"])
 * Uses event delegation; call initSpellTooltips(spells) once after DOMContentLoaded.
 */

const TOOLTIP_ID = "spell-tooltip";
const OFFSET_PX = 8; // gap between element edge and tooltip

function createTooltipEl() {
  const el = document.createElement("div");
  el.id = TOOLTIP_ID;
  el.className = "spell-tooltip";
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}

function populateTooltip(el, spell) {
  const DETAIL_KEYS = [
    { key: "castingTime", label: "Casting Time" },
    { key: "range", label: "Range" },
    { key: "components", label: "Components" },
    { key: "duration", label: "Duration" },
  ];

  const detailsHtml = DETAIL_KEYS.map(({ key, label }) => {
    const val = spell[key];
    if (!val) return "";
    return `<dt>${label}</dt><dd>${val}</dd>`;
  })
    .filter(Boolean)
    .join("");

  const schoolClass = spell.school
    ? ` spell-school--${spell.school.toLowerCase()}`
    : "";
  const schoolIcon = spell.school
    ? `<span class="spell-tooltip-school-icon" aria-hidden="true"></span>`
    : "";

  // Set school class on the tooltip element itself (drives the mask-image rule)
  el.className = `spell-tooltip${schoolClass}`;

  el.innerHTML =
    `<div class="spell-tooltip-header">` +
    `<div class="spell-tooltip-header-text">` +
    `<div class="spell-tooltip-name">${spell.name}</div>` +
    (spell.levelSchool
      ? `<div class="spell-tooltip-level-school">${spell.levelSchool}</div>`
      : "") +
    `</div>` +
    schoolIcon +
    `</div>` +
    (detailsHtml
      ? `<dl class="spell-tooltip-details">${detailsHtml}</dl>`
      : "") +
    (spell.bodyHtml
      ? `<div class="spell-tooltip-body">${spell.bodyHtml}</div>`
      : "");
}

function positionTooltip(el, anchor) {
  // Make visible (but off-screen) to measure
  el.style.visibility = "hidden";
  el.hidden = false;

  const rect = anchor.getBoundingClientRect();
  const ttRect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Prefer above; fall back to below
  let top = rect.top - ttRect.height - OFFSET_PX;
  if (top < 4) top = rect.bottom + OFFSET_PX;

  // Horizontally: center on anchor, clamp to viewport
  let left = rect.left + rect.width / 2 - ttRect.width / 2;
  left = Math.max(4, Math.min(left, vw - ttRect.width - 4));

  el.style.top = `${top + window.scrollY}px`;
  el.style.left = `${left + window.scrollX}px`;
  el.style.visibility = "";
}

export function initSpellTooltips(spells) {
  if (!spells || typeof spells !== "object") return;

  const tooltip = createTooltipEl();
  let pinned = false; // mobile: tooltip stays open until click-elsewhere

  function showTooltip(anchor, slug) {
    const spell = spells[slug];
    if (!spell) return;
    populateTooltip(tooltip, spell);
    positionTooltip(tooltip, anchor);
  }

  function hideTooltip() {
    tooltip.hidden = true;
    tooltip.classList.remove("spell-tooltip--pinned");
    pinned = false;
  }

  // Desktop hover
  document.addEventListener("mouseover", function (e) {
    if (pinned) return;
    const ref = e.target.closest(".spell-ref[data-spell]");
    if (!ref) return;
    showTooltip(ref, ref.dataset.spell);
  });

  document.addEventListener("mouseout", function (e) {
    if (pinned) return;
    const ref = e.target.closest(".spell-ref[data-spell]");
    if (!ref) return;
    // Only hide if leaving the ref element (not moving to a child)
    if (!ref.contains(e.relatedTarget)) {
      tooltip.hidden = true;
    }
  });

  // Mobile / touch: click toggles; click elsewhere dismisses
  document.addEventListener("click", function (e) {
    const ref = e.target.closest(".spell-ref[data-spell]");
    if (ref) {
      e.stopPropagation();
      if (pinned && !tooltip.hidden) {
        hideTooltip();
      } else {
        showTooltip(ref, ref.dataset.spell);
        tooltip.classList.add("spell-tooltip--pinned");
        pinned = true;
      }
      return;
    }
    // Click outside — dismiss pinned tooltip
    if (pinned) hideTooltip();
    tooltip.classList.remove("spell-tooltip--pinned");
  });
}
