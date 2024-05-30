window.document.addEventListener("DOMContentLoaded", () => {
  const countDiv = document.querySelector(".count");

  countDiv.textContent = Number(localStorage.getItem("count"));
  document.querySelector(".c-up").addEventListener("click", () => {
    const count = Number(localStorage.getItem("count"));
    const newCount = count + 250;
    if (newCount > 5000) return;

    localStorage.setItem("count", newCount);
    countDiv.textContent = newCount;
    update(true);
  });

  document.querySelector(".c-down").addEventListener("click", () => {
    const count = Number(localStorage.getItem("count"));
    const newCount = count - 250;
    if (newCount < -5000) return;

    localStorage.setItem("count", newCount);
    countDiv.textContent = newCount;
    update(true);
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
    } else if (width != "0%")
      document.querySelector(".progress-bar").style.width = "0%";
  });
});
