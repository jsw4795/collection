"use strict";

const wineDialog = document.querySelector("#detail-dialog");

wineDialog.addEventListener("click", (event) => {
  const rect = wineDialog.getBoundingClientRect();
  const clickedBackdrop = event.clientX < rect.left || event.clientX > rect.right
    || event.clientY < rect.top || event.clientY > rect.bottom;
  if (clickedBackdrop) wineDialog.close();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && wineDialog.open) wineDialog.close();
});
