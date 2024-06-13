if (!localStorage.getItem("token")) window.location.href = "/login";

window.document.addEventListener("DOMContentLoaded", async () => {
  navigator.wakeLock?.request();
  setTimeout(
    () => (document.querySelector(".loader-screen").style.display = "none"),
    500
  );

  const countDiv = document.querySelector(".count");
  const fullscreenBtn = document.querySelector(".fullscreen");
  const translateBtn = document.querySelector(".translate");
  const upBtn = document.querySelector(".c-up");
  const downBtn = document.querySelector(".c-down");
  const logoutBtn = document.querySelector(".logout");
  const themeBtn = document.querySelector(".theme");
  const fromStorage = Number(localStorage.getItem("count"));

  translateBtn.addEventListener("click", () => writeTranslates());
  if (!localStorage.getItem("count")) localStorage.setItem("count", 0);

  // TODO: Theme color
  themeBtn.addEventListener("click", () => {
    changeColor();
  });

  // Fullscreen
  fullscreenBtn.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  });

  // Theme

  // Adjustments
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
  countDiv.addEventListener("click", () => {
    upBtn.classList.remove("disabled");
    downBtn.classList.remove("disabled");
    localStorage.setItem("count", 0);
    countDiv.textContent = "0s";

    update(true);
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.reload();
  });

  // Auto scroll when page is visible
  document.addEventListener("visibilitychange", () => {
    const elemet = document.querySelector(".highlight");

    if (document.visibilityState === "visible") {
      navigator.wakeLock?.request();

      if (elemet) scrollIntoView(elemet, false);
    }
  });

  // Main
  getCurrentlyPlaying().then((data) => handleData(data));
  setInterval(async () => {
    const data = await getCurrentlyPlaying();

    if (data.timestamp !== spotify.timestamp) handleData(data);
  }, 1000);

  setInterval(() => {
    if (spotify.name)
      document.documentElement.style.setProperty(
        "--progress-bar-width",
        `${
          ((spotify.progress() + Number(localStorage.getItem("count"))) /
            spotify.duration) *
          100
        }%`
      );
    else
      document.documentElement.style.setProperty("--progress-bar-width", `0%`);
  }, 250);
});
