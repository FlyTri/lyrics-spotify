window.document.addEventListener("DOMContentLoaded", () => {
  const countDiv = document.querySelector(".count")
  const translateBtn = document.querySelector(".translate")
  const upBtn = document.querySelector(".c-up")
  const downBtn = document.querySelector(".c-down")
  const logoutBtn = document.querySelector(".logout")
  const fromStorage = Number(localStorage.getItem("count"))

  translateBtn.addEventListener("click", () => writeTranslates())

  countDiv.textContent = fromStorage / 1000 + "s"
  if (fromStorage === 5000) upBtn.classList.add("disabled")
  if (fromStorage === -5000) downBtn.classList.add("disabled")
  upBtn.addEventListener("click", () => {
    const count = Number(localStorage.getItem("count"))
    const newCount = count + 250
    if (newCount + 250 > 5000) upBtn.classList.add("disabled")

    if (downBtn.classList.contains("disabled"))
      downBtn.classList.remove("disabled")
    localStorage.setItem("count", newCount)
    countDiv.textContent = newCount / 1000 + "s"
    update(true)
  })

  downBtn.addEventListener("click", () => {
    const count = Number(localStorage.getItem("count"))
    const newCount = count - 250
    if (newCount - 250 < -5000) downBtn.classList.add("disabled")

    if (upBtn.classList.contains("disabled")) upBtn.classList.remove("disabled")
    localStorage.setItem("count", newCount)
    countDiv.textContent = newCount / 1000 + "s"
    update(true)
  })

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("id")
    window.location.reload()
  })

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      lyrics &&
      lyrics.type !== "NOT_SYNCED"
    )
      scrollIntoView(document.querySelector(".highlight"), false)
  })

  setInterval(() => {
    if (playing) {
      document.documentElement.style.setProperty(
        "--progress-bar-width",
        `${
          ((DateNow() - spotify.timestamps.start) /
            (spotify.timestamps.end -
              DateNow() +
              (DateNow() - spotify.timestamps.start))) *
          100
        }%`
      )
    } else {
      document.documentElement.style.setProperty("--progress-bar-width", "0%")
    }
  }, 500)
})
