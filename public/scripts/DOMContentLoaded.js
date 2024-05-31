window.document.addEventListener("DOMContentLoaded", () => {
  const countDiv = document.querySelector(".count");
  const translateBtn = document.querySelector(".translate");
  const upBtn = document.querySelector(".c-up");
  const downBtn = document.querySelector(".c-down");
  const logoutBtn = document.querySelector(".logout");
  const fromStorage = Number(localStorage.getItem("count"));

  translateBtn.addEventListener("click", () => {
    const lines = document.querySelectorAll(".translated");
    if (lines.length) return lines.forEach((element) => element.remove());

    document.querySelectorAll(".lyrics").forEach((element) => {
      const translated = lyrics.translated.find(
        (obj) => obj.original === element.textContent
      );

      if (translated) {
        const p = document.createElement("p");

        p.classList.add("translated");
        p.textContent = translated.text;
        element.appendChild(p);
      }
    });
    document
      .querySelector(".highlight")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  });

  countDiv.textContent = fromStorage / 1000 + "s";
  if (fromStorage === 5000) upBtn.classList.add("disabled");
  if (fromStorage === -5000) downBtn.classList.add("disabled");
  upBtn.addEventListener("click", () => {
    const count = Number(localStorage.getItem("count"));
    const newCount = count + 250;
    if (newCount + 250 > 5000) upBtn.classList.add("disabled");

    if (downBtn.classList.contains("disabled"))
      downBtn.classList.remove("disabled");
    localStorage.setItem("count", newCount);
    countDiv.textContent = newCount / 1000 + "s";
    update(true);
  });

  downBtn.addEventListener("click", () => {
    const count = Number(localStorage.getItem("count"));
    const newCount = count - 250;
    if (newCount - 250 < -5000) downBtn.classList.add("disabled");

    if (upBtn.classList.contains("disabled"))
      upBtn.classList.remove("disabled");
    localStorage.setItem("count", newCount);
    countDiv.textContent = newCount / 1000 + "s";
    update(true);
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("id");
    window.location.reload();
  });

  setInterval(() => {
    const width = document.querySelector(".progress-bar").style.width;

    if (playing) {
      document.querySelector(".progress-bar").style.width = `${
        ((DateNow() - spotify.timestamps.start) /
          (spotify.timestamps.end -
            DateNow() +
            (DateNow() - spotify.timestamps.start))) *
        100
      }%`;
    } else if (width !== "0%")
      document.querySelector(".progress-bar").style.width = "0%";
  });
});
