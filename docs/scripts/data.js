export function getCards() {
  const el = document.getElementById("cards-data");
  if (!el) return [];

  try {
    return JSON.parse(el.textContent || "[]");
  } catch {
    return [];
  }
}

export function getSpells() {
  const el = document.getElementById("spells-data");
  if (!el) return {};

  try {
    return JSON.parse(el.textContent || "{}");
  } catch {
    return {};
  }
}
