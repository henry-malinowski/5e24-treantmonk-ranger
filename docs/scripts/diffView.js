export function createDiffViewController(modalEl, toggleEl) {
  const toggleInput = toggleEl.querySelector("#diff-toggle-input");

  let currentSections = null;

  function hasDiffs() {
    return !!modalEl.querySelector(".diff-del, .diff-add");
  }

  /** Walk up from each diff span to its nearest <p> or .spell-body ancestor. */
  function getAffectedSections() {
    const diffs = Array.from(modalEl.querySelectorAll(".diff-del, .diff-add"));
    const seen = new Set();
    for (const diff of diffs) {
      let el = diff.parentElement;
      while (el && el !== modalEl) {
        if (el.matches("p, .spell-body, dd")) {
          seen.add(el);
          break;
        }
        el = el.parentElement;
      }
    }
    return Array.from(seen).sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    );
  }

  function reveal() {
    const sections = getAffectedSections();
    gsap.to(sections, {
      opacity: 0,
      duration: 0.1,
      onComplete() {
        modalEl.classList.add("modal--diff");
        gsap.fromTo(
          sections,
          { opacity: 0, clipPath: "inset(0 0 100% 0)" },
          {
            opacity: 1,
            clipPath: "inset(0 0 0% 0)",
            duration: 0.28,
            stagger: 0.07,
            ease: "power2.out",
            clearProps: "clipPath,opacity",
          },
        );
      },
    });
    currentSections = sections;
  }

  function hide() {
    const sections = getAffectedSections();
    gsap.to(sections, {
      opacity: 0,
      duration: 0.1,
      onComplete() {
        modalEl.classList.remove("modal--diff");
        gsap.fromTo(
          sections,
          { opacity: 0, clipPath: "inset(0 0 100% 0)" },
          {
            opacity: 1,
            clipPath: "inset(0 0 0% 0)",
            duration: 0.22,
            stagger: 0.06,
            ease: "power2.out",
            clearProps: "clipPath,opacity",
          },
        );
      },
    });
    currentSections = sections;
  }

  function reset() {
    toggleInput.checked = false;
    if (currentSections) {
      gsap.killTweensOf(currentSections);
      gsap.set(currentSections, { clearProps: "all" });
      currentSections = null;
    }
    modalEl.classList.remove("modal--diff");
    toggleEl.hidden = !hasDiffs();
  }

  toggleInput.addEventListener("change", function () {
    if (toggleInput.checked) {
      reveal();
    } else {
      hide();
    }
  });

  return { reset: reset, hasDiffs: hasDiffs };
}
