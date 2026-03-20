export function closeAllDropdowns() {
  document.querySelectorAll(".modal-dropdown-menu").forEach(function (menu) {
    menu.hidden = true;
  });
  document.querySelectorAll("[aria-expanded]").forEach(function (button) {
    button.setAttribute("aria-expanded", "false");
  });
}

export function makeGDocGroup(googleDocsUrl) {
  if (!googleDocsUrl) return null;
  const link = document.createElement("a");
  link.href = googleDocsUrl;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "modal-icon-btn modal-icon-btn--gdoc";
  link.title = "Source Document";
  link.innerHTML = '<i class="fa-solid fa-file-lines"></i>';
  return link;
}

export function makeYtGroup(ytLinks) {
  if (!ytLinks || !ytLinks.length) return null;

  if (ytLinks.length === 1) {
    const link = document.createElement("a");
    link.href = ytLinks[0].url;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "modal-icon-btn modal-icon-btn--youtube";
    link.title = ytLinks[0].label;
    link.innerHTML = '<i class="fa-brands fa-youtube"></i>';
    return link;
  }

  const wrap = document.createElement("div");
  wrap.className = "modal-icon-dropdown";

  const btn = document.createElement("button");
  btn.className = "modal-icon-btn modal-icon-btn--youtube";
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = '<i class="fa-brands fa-youtube"></i>';

  const menu = document.createElement("div");
  menu.className = "modal-dropdown-menu";
  menu.hidden = true;

  ytLinks.forEach(function (linkData) {
    const link = document.createElement("a");
    link.href = linkData.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = linkData.label;
    menu.appendChild(link);
  });

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    const wasOpen = !menu.hidden;
    closeAllDropdowns();
    if (!wasOpen) {
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    }
  });

  wrap.appendChild(btn);
  wrap.appendChild(menu);
  return wrap;
}
