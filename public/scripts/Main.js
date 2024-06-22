if (!localStorage.getItem("token")) window.location.href = "/login";

window.document.addEventListener("DOMContentLoaded", async () => {
  navigator.wakeLock?.request();
  setTimeout(() => {
    $(".loader-screen").style.display = "none";
  }, 500);

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
  const fromStorage = _.toNumber(localStorage.getItem("count")) || 0;
  const updateCountDiv = (count) => {
    elements.countDiv.textContent = `${count / 1000}s`;
  };
  const toggleFullscreenIcons = (
    isFullscreen = window.innerHeight === screen.height
  ) => {
    $(".fullscreen-icon").hidden = isFullscreen;
    $(".compress-icon").hidden = !isFullscreen;
  };

  // Event listeners
  elements.translateBtn.addEventListener("click", writeTranslates);

  if (!localStorage.getItem("count")) localStorage.setItem("count", 0);

  elements.themeBtn.addEventListener("click", changeColor);

  elements.fullscreenBtn.addEventListener("click", async () => {
    if (window.innerHeight === screen.height) {
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
    let count = _.toNumber(localStorage.getItem("count"));

    count = _.clamp(count + increment, -5000, 5000);
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
      if (element) scrollIntoView(element, false);
    }
  });

  window.addEventListener("resize", () => {
    const element = $(".highlight");
    if (element) scrollIntoView(element, false);
    toggleFullscreenIcons();
  });

  // Main functionality
  const handleDataWithUpdate = (data) => {
    handleData(data);
    if (spotify.name) {
      document.documentElement.style.setProperty(
        "--progress-bar-width",
        `${((spotify.progress() + fromStorage) / spotify.duration) * 100}%`
      );
    } else {
      document.documentElement.style.setProperty("--progress-bar-width", `0%`);
    }
  };

  getCurrentlyPlaying().then(handleDataWithUpdate);
  setInterval(async () => {
    if (!navigator.onLine) return;
    const data = await getCurrentlyPlaying();
    if (data.timestamp !== spotify.timestamp) handleDataWithUpdate(data);
  }, 2500);

  window.addEventListener("online", () => {
    showMessage("Đã kết nối Internet");
    handleDataWithUpdate({ playing: false });
  });
  window.addEventListener("offline", () => {
    showMessage("Đã ngắt kết nối Internet");
    handleDataWithUpdate({ playing: false });
  });

  setInterval(() => {
    if (spotify.name) {
      document.documentElement.style.setProperty(
        "--progress-bar-width",
        `${((spotify.progress() + fromStorage) / spotify.duration) * 100}%`
      );
    } else {
      document.documentElement.style.setProperty("--progress-bar-width", `0%`);
    }
  }, 500);
});
