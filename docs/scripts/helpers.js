export function makeImgEl(src, alt, fallbackClass) {
  const img = document.createElement("img");
  img.alt = alt;
  img.loading = "lazy";
  img.src = src;
  img.addEventListener("error", function () {
    const fb = document.createElement("div");
    fb.className = fallbackClass;
    fb.innerHTML = '<i class="fa-solid fa-image"></i>';
    this.replaceWith(fb);
  });
  return img;
}
