export function createModalController(options) {
  const {
    cards,
    makeImgEl,
    makeGDocGroup,
    makeYtGroup,
    closeAllDropdowns,
    onOpen,
  } = options;

  const backdrop = document.getElementById("modal-backdrop");
  const modalEl = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalSubtitle = document.getElementById("modal-subtitle");
  const modalHero = document.getElementById("modal-hero");
  const modalDesc = document.getElementById("modal-description");
  const linkBtns = document.getElementById("modal-link-btns");
  const modalCloseBtn = document.getElementById("modal-close");
  const modalNavPrevBtn = document.getElementById("modal-nav-prev");
  const modalNavNextBtn = document.getElementById("modal-nav-next");

  let currentModalIndex = 0;
  let prefetchedModalIdx = -1;

  function openModal(index) {
    currentModalIndex = index;
    prefetchedModalIdx = -1;
    const card = cards[index];

    modalTitle.textContent = card.name;
    if (card.subtitle) {
      modalSubtitle.textContent = card.subtitle;
      modalSubtitle.hidden = false;
    } else {
      modalSubtitle.hidden = true;
    }

    modalHero.hidden = true;
    modalHero.innerHTML = "";

    if (card.descriptionHtml) {
      modalDesc.innerHTML = card.descriptionHtml;
      modalDesc.hidden = false;
    } else {
      modalDesc.innerHTML = "";
      modalDesc.hidden = true;
    }

    if (onOpen) onOpen();

    linkBtns.innerHTML = "";
    closeAllDropdowns();
    const gdocGroup = makeGDocGroup(card.googleDocsUrl);
    if (gdocGroup) linkBtns.appendChild(gdocGroup);
    const ytGroup = makeYtGroup(card.ytLinks);
    if (ytGroup) linkBtns.appendChild(ytGroup);

    history.replaceState(null, "", "#" + card.id);
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    modalEl.querySelector(".modal-scroll").scrollTop = 0;
  }

  function closeModal() {
    history.replaceState(null, "", location.pathname + location.search);
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }

  function stepModal(delta) {
    openModal((currentModalIndex + delta + cards.length) % cards.length);
  }

  function isOpen() {
    return backdrop.classList.contains("open");
  }

  function getModalIndexByHash(hash) {
    const normalizedHash = hash.toLowerCase();
    return cards.findIndex(function (card) {
      return card.id.toLowerCase() === normalizedHash;
    });
  }

  function prefetchCardImage(index) {
    const card = cards[index];
    if (card && card.image) new Image().src = card.image;
  }

  function prefetchNearNavButtons(mouseEvent) {
    if (!isOpen() || window.innerWidth <= 900) return;

    function nearBtn(btn) {
      const rect = btn.getBoundingClientRect();
      return (
        Math.abs(mouseEvent.clientX - (rect.left + rect.right) / 2) < 400 &&
        Math.abs(mouseEvent.clientY - (rect.top + rect.bottom) / 2) < 400
      );
    }

    let targetIdx = null;
    if (nearBtn(modalNavPrevBtn)) {
      targetIdx = (currentModalIndex - 1 + cards.length) % cards.length;
    } else if (nearBtn(modalNavNextBtn)) {
      targetIdx = (currentModalIndex + 1) % cards.length;
    }

    if (targetIdx !== null && targetIdx !== prefetchedModalIdx) {
      const src = cards[targetIdx].image;
      if (src) new Image().src = src;
      prefetchedModalIdx = targetIdx;
    }
  }

  modalCloseBtn.addEventListener("click", closeModal);
  modalNavPrevBtn.addEventListener("mousedown", function (e) {
    e.stopPropagation();
    stepModal(-1);
  });
  modalNavNextBtn.addEventListener("mousedown", function (e) {
    e.stopPropagation();
    stepModal(1);
  });
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeModal();
  });
  backdrop.addEventListener("mousemove", prefetchNearNavButtons);

  return {
    backdrop,
    openModal,
    closeModal,
    stepModal,
    isOpen,
    getModalIndexByHash,
    prefetchCardImage,
  };
}
