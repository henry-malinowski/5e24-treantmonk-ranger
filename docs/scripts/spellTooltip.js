/**
 * Spell tooltip — shows stat block on hover (.spell-ref[data-spell="<slug>"])
 * Uses event delegation; call initSpellTooltips(spells) once after DOMContentLoaded.
 */

const TOOLTIP_ID = "spell-tooltip";
const BACKDROP_ID = "spell-tooltip-backdrop";
const OFFSET_PX = 8; // gap between element edge and tooltip
const MOBILE_QUERY = "(max-width: 600px)";
const CLOSE_ANIMATION_MS = 150;

function createTooltipEl() {
  const el = document.createElement("div");
  el.id = TOOLTIP_ID;
  el.className = "spell-tooltip";
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}

function createBackdropEl() {
  const el = document.createElement("div");
  el.id = BACKDROP_ID;
  el.className = "spell-tooltip-backdrop";
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

  if (window.matchMedia(MOBILE_QUERY).matches) {
    el.style.top = "";
    el.style.left = "";
    el.style.visibility = "";
    return;
  }

  const rect = anchor.getBoundingClientRect();
  const ttRect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gutter = 8;

  const aboveTop = rect.top - ttRect.height - OFFSET_PX;
  const belowTop = rect.bottom + OFFSET_PX;
  const spaceAbove = rect.top - gutter;
  const spaceBelow = vh - rect.bottom - gutter;

  // Prefer the side with room; when neither fits, use the larger side and clamp.
  let top;
  if (spaceAbove >= ttRect.height) {
    top = aboveTop;
  } else if (spaceBelow >= ttRect.height) {
    top = belowTop;
  } else {
    top = spaceBelow >= spaceAbove ? belowTop : aboveTop;
  }
  top = Math.max(gutter, Math.min(top, vh - ttRect.height - gutter));

  // Horizontally: center on anchor, clamp to viewport
  let left = rect.left + rect.width / 2 - ttRect.width / 2;
  left = Math.max(gutter, Math.min(left, vw - ttRect.width - gutter));

  el.style.top = `${top + window.scrollY}px`;
  el.style.left = `${left + window.scrollX}px`;
  el.style.visibility = "";
}

export function initSpellTooltips(spells) {
  if (!spells || typeof spells !== "object") return;

  const tooltip = createTooltipEl();
  const backdrop = createBackdropEl();
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  let pinned = false; // mobile: tooltip stays open until click-elsewhere
  let pinnedSlug = null;
  let closeTimer = null;

  function isMobile() {
    return mobileQuery.matches;
  }

  function showTooltip(anchor, slug) {
    const spell = spells[slug];
    if (!spell) return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    tooltip.classList.remove("spell-tooltip--closing");
    backdrop.classList.remove("spell-tooltip-backdrop--closing");
    populateTooltip(tooltip, spell);
    positionTooltip(tooltip, anchor);
  }

  function showBackdrop() {
    if (!isMobile()) return;
    backdrop.hidden = false;
  }

  function hideTooltip() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    if (isMobile() && !tooltip.hidden) {
      tooltip.classList.add("spell-tooltip--closing");
      backdrop.classList.add("spell-tooltip-backdrop--closing");
      closeTimer = setTimeout(finishHideTooltip, CLOSE_ANIMATION_MS);
      pinned = false;
      pinnedSlug = null;
      return;
    }

    finishHideTooltip();
  }

  function finishHideTooltip() {
    closeTimer = null;
    tooltip.hidden = true;
    tooltip.classList.remove("spell-tooltip--pinned", "spell-tooltip--closing");
    tooltip.style.top = "";
    tooltip.style.left = "";
    backdrop.hidden = true;
    backdrop.classList.remove("spell-tooltip-backdrop--closing");
    pinned = false;
    pinnedSlug = null;
  }

  // Desktop hover
  document.addEventListener("mouseover", function (e) {
    if (isMobile()) return;
    if (pinned) return;
    const ref = e.target.closest(".spell-ref[data-spell]");
    if (!ref) return;
    showTooltip(ref, ref.dataset.spell);
  });

  document.addEventListener("mouseout", function (e) {
    if (isMobile()) return;
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

    if (!isMobile()) {
      if (tooltip.contains(e.target)) {
        e.stopPropagation();
        return;
      }

      if (ref) {
        e.stopPropagation();
        if (pinned && !tooltip.hidden && pinnedSlug === ref.dataset.spell) {
          hideTooltip();
        } else {
          showTooltip(ref, ref.dataset.spell);
          tooltip.classList.add("spell-tooltip--pinned");
          pinned = true;
          pinnedSlug = ref.dataset.spell;
        }
        return;
      }

      if (pinned) hideTooltip();
      return;
    }

    if (ref) {
      e.stopPropagation();
      if (pinned && !tooltip.hidden && pinnedSlug === ref.dataset.spell) {
        hideTooltip();
      } else {
        showTooltip(ref, ref.dataset.spell);
        tooltip.classList.add("spell-tooltip--pinned");
        showBackdrop();
        pinned = true;
        pinnedSlug = ref.dataset.spell;
      }
      return;
    }
    // Click outside — dismiss pinned tooltip
    if (pinned) hideTooltip();
    tooltip.classList.remove("spell-tooltip--pinned");
  });

  backdrop.addEventListener("pointerdown", hideTooltip);
  backdrop.addEventListener("wheel", function (e) {
    e.preventDefault();
  }, { passive: false });
  backdrop.addEventListener("touchmove", function (e) {
    e.preventDefault();
  }, { passive: false });

  mobileQuery.addEventListener("change", hideTooltip);
}
