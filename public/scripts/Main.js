if (!localStorage.getItem("token")) location.href = "/login";

let scrolling;

document.addEventListener("DOMContentLoaded", async () => {
  $(".content-container").addEventListener("scroll", () => (scrolling = true));
  $(".content-container").addEventListener(
    "scrollend",
    () => (scrolling = false)
  );

  const loadKuroshiro = await initKuromoji();

  if (!loadKuroshiro) return;

  if (navigator.userAgent.includes("Windows NT 1")) {
    $(".loading-status").textContent = "Checking MSS...";

    if (!(await checkMSS()))
      showMessage(
        "Mẹo: Cài đặt Media Session Server giúp đồng bộ thời gian chính xác hơn",
        "https://github.com/FlyTri/media-session-server"
      );
  }

  $(".loader-screen").remove();

  if (document.visibilityState === "visible") navigator.wakeLock?.request();

  const fromStorage = +localStorage.getItem("count") || 0;
  const updateCountDiv = (count) => {
    $(".count").textContent = `${count / 1000}s`;
  };
  const toggleFullscreenIcons = (isFullscreen = document.fullscreenElement) => {
    $(".fullscreen-icon").hidden = isFullscreen;
    $(".compress-icon").hidden = !isFullscreen;
  };

  if (!localStorage.getItem("convert")) localStorage.setItem("convert", 0);

  $(".convert").addEventListener("click", () => {
    localStorage.setItem(
      "convert",
      localStorage.getItem("convert") === "1" ? 0 : 1
    );
    convert();
  });

  if (!localStorage.getItem("count")) localStorage.setItem("count", 0);

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
    update();
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
    update();
  });

  $(".logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    location.reload();
  });

  document.addEventListener("visibilitychange", () => {
    const currentHighlight = $(".highlight");
    const currentInterlude = $(".highlight .dot")?.parentElement;

    if (document.visibilityState === "visible") {
      navigator.wakeLock?.request();
      if (currentHighlight) scrollToCenter(currentHighlight, false);
      if (currentInterlude)
        updateInterlude(currentInterlude, getElementIndex(currentInterlude));
    }
  });

  addEventListener("resize", () => {
    const element = $(".highlight");

    if (element) scrollToCenter(element, false);

    toggleFullscreenIcons();
  });

  // Main functionality
  function main() {
    if (!navigator.onLine) return;

    getCurrentlyPlaying().then(async (data) => {
      setTimeout(() => main(), 1000);

      if (data) handleData(data);
    });
  }
  main();

  addEventListener("online", () => {
    showMessage("Đã kết nối Internet");
    handleDataWithUpdate({ playing: false });
  });

  addEventListener("offline", () => {
    showMessage("Đã ngắt kết nối Internet", null, "warning");
    handleDataWithUpdate({ playing: false });
  });

  setInterval(() => {
    if (spotify.duration) {
      $(".progress-bar").style.width = `${
        ((spotify.position + fromStorage) / spotify.duration) * 100
      }%`;
    } else {
      $(".progress-bar").style.width = 0;
    }
  }, 500);
});
