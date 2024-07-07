if (!localStorage.getItem("token")) window.location.href = "/login";

window.document.addEventListener("DOMContentLoaded", async () => {
  setTimeout(async () => {
    $(".loader-screen").remove();

    await axios("http://127.0.0.1:8170/")
      .then(() => showMessage("Đã cài đặt Media Session Server"))
      .catch(() => null);
  }, 500);

  if (document.visibilityState === "visible") navigator.wakeLock?.request();

  const elements = {
    countDiv: $(".count"),
    fullscreenBtn: $(".fullscreen"),
    translateBtn: $(".translate"),
    upBtn: $(".c-up"),
    downBtn: $(".c-down"),
    logoutBtn: $(".logout"),
    themeBtn: $(".theme"),
  };

  // Initial setup
  const fromStorage = +localStorage.getItem("count") || 0;
  const updateCountDiv = (count) => {
    elements.countDiv.textContent = `${count / 1000}s`;
  };
  const toggleFullscreenIcons = (isFullscreen = document.fullscreenElement) => {
    $(".fullscreen-icon").hidden = isFullscreen;
    $(".compress-icon").hidden = !isFullscreen;
  };

  // Event listeners
  elements.translateBtn.addEventListener("click", writeTranslates);

  if (!localStorage.getItem("count")) localStorage.setItem("count", 0);

  elements.themeBtn.addEventListener("click", changeColor);

  elements.fullscreenBtn.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }

    toggleFullscreenIcons();
  });

  // Count adjustments
  updateCountDiv(fromStorage);
  elements.upBtn.classList.toggle("disabled", fromStorage === 5000);
  elements.downBtn.classList.toggle("disabled", fromStorage === -5000);

  const updateCount = (increment) => {
    const count = Math.min(
      Math.max(+localStorage.getItem("count") + increment, -5000),
      5000
    );

    localStorage.setItem("count", count);
    updateCountDiv(count);
    update(true);
    elements.upBtn.classList.toggle("disabled", count === 5000);
    elements.downBtn.classList.toggle("disabled", count === -5000);
  };

  elements.upBtn.addEventListener("click", () => updateCount(250));
  elements.downBtn.addEventListener("click", () => updateCount(-250));
  elements.countDiv.addEventListener("click", () => {
    localStorage.setItem("count", 0);
    updateCountDiv(0);
    elements.upBtn.classList.remove("disabled");
    elements.downBtn.classList.remove("disabled");
    update(true);
  });

  // Seek to word/line
  document
    .querySelector(".content")
    .addEventListener("click", async (event) => {
      return; //TODO:
      const index = getElementIndex(event.target);

      if (index) {
        const position = Number(index.replace("index-", ""));
        const word = lyrics.data[position];

        seekTo(word.time);
        setTimeout(
          () => getCurrentlyPlaying().then((data) => handleData(data)),
          500
        );
      }
    });

  // Logout
  elements.logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.reload();
  });

  // Auto scroll and fullscreen handling
  document.addEventListener("visibilitychange", () => {
    const element = $(".highlight");

    if (document.visibilityState === "visible") {
      navigator.wakeLock?.request();
      if (element) scrollToCenter(element, false);
    }
  });

  window.addEventListener("resize", () => {
    const element = $(".highlight");

    if (element) scrollToCenter(element, false);

    toggleFullscreenIcons();
  });

  // Main functionality
  getCurrentlyPlaying().then(handleData);
  setInterval(async () => {
    if (!navigator.onLine) return;

    const data = await getCurrentlyPlaying();

    if (data.timestamp !== spotify.timestamp) handleData(data);
  }, 2500);

  window.addEventListener("online", () => {
    showMessage("Đã kết nối Internet");
    handleDataWithUpdate({ playing: false });
  });

  window.addEventListener("offline", () => {
    showMessage("Đã ngắt kết nối Internet");
    handleDataWithUpdate({ playing: false });
  });

  setInterval(async () => {
    if (spotify.name) {
      $(".progress-bar").style.width = `${
        ((spotify.position + fromStorage) / spotify.duration) * 100
      }%`;
    } else {
      $(".progress-bar").style = null;
    }
  }, 500);
});
