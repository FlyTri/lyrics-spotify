if (!localStorage.getItem("token")) window.location.href = "/login";

window.document.addEventListener("DOMContentLoaded", async () => {
  setTimeout(async () => {
    $(".loader-screen").remove();

    if (navigator.userAgent.includes("Windows NT 1"))
      axios("http://127.0.0.1:8170/", { timeout: 500 }).catch(() =>
        showMessage(
          '<a href="https://github.com/FlyTri/media-session-server" target="_blank">Mẹo: Cài đặt Media Session Server giúp đồng bộ thời gian chính xác hơn</a>',
          "info",
          true
        )
      );
  }, 500);

  if (document.visibilityState === "visible") navigator.wakeLock?.request();

  const fromStorage = +localStorage.getItem("count") || 0;
  const updateCountDiv = (count) => {
    $(".count").textContent = `${count / 1000}s`;
  };
  const toggleFullscreenIcons = (isFullscreen = document.fullscreenElement) => {
    $(".fullscreen-icon").hidden = isFullscreen;
    $(".compress-icon").hidden = !isFullscreen;
  };

  $(".translate").addEventListener("click", writeTranslates);

  if (!localStorage.getItem("count")) localStorage.setItem("count", 0);

  $(".theme").addEventListener("click", changeColor);

  $(".fullscreen").addEventListener("click", async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }

    toggleFullscreenIcons();
  });

  updateCountDiv(fromStorage);
  $(".c-up").classList.toggle("disabled", fromStorage === 5000);
  $(".c-down").classList.toggle("disabled", fromStorage === -5000);

  const updateCount = (increment) => {
    const count = Math.min(
      Math.max(+localStorage.getItem("count") + increment, -5000),
      5000
    );

    localStorage.setItem("count", count);
    updateCountDiv(count);
    update(true);
    $(".c-up").classList.toggle("disabled", count === 5000);
    $(".c-down").classList.toggle("disabled", count === -5000);
  };

  $(".c-up").addEventListener("click", () => updateCount(250));
  $(".c-down").addEventListener("click", () => updateCount(-250));
  $(".count").addEventListener("click", () => {
    localStorage.setItem("count", 0);
    updateCountDiv(0);
    $(".c-up").classList.remove("disabled");
    $(".c-down").classList.remove("disabled");
    update(true);
  });

  document
    .querySelector(".content")
    .addEventListener("click", async (event) => {});

  $(".logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.reload();
  });

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

    if (data.position === spotify.position && data.id === spotify.id) return;
    if (data.timestamp === spotify.timestamp) return;

    handleData(data);
  }, 2500);

  window.addEventListener("online", () => {
    showMessage("Đã kết nối Internet");
    handleDataWithUpdate({ playing: false });
  });

  window.addEventListener("offline", () => {
    showMessage("Đã ngắt kết nối Internet", "warning");
    handleDataWithUpdate({ playing: false });
  });

  setInterval(async () => {
    if (spotify.id) {
      $(".progress-bar").style.width = `${
        ((spotify.position + fromStorage) / spotify.duration) * 100
      }%`;
    } else {
      $(".progress-bar").style = null;
    }
  }, 500);
});
