let timeout = null;
const scrollOptions = {
  time: 500,
  ease: (n) => n,
  maxSynchronousAlignments: 1,
};
const colors = {
  success: "#a6e3a1",
  error: "#f38ba8",
  warning: "#fab387",
  info: "#89b4fa",
};

function $(query) {
  return document.querySelector(query);
}
function $All(query) {
  return document.querySelectorAll(query);
}
function random(array) {
  const index = Math.floor(Math.random() * array.length);

  return array[index];
}
function emoji(emo) {
  return `<span class="emoji">${emo}</span>`;
}
function scrollToCenter(element, check = true) {
  if (!element) return;
  if (element.classList.contains("highlight"))
    switch (lyrics.type) {
      case "TEXT_SYNCED":
        element = element.parentElement;
        break;
      case "NOT_SYNCED":
        return;
    }

  if (!check) return scrollIntoView(element, scrollOptions);

  const { clientHeight } = document.body;
  const { bottom, top } = element.getBoundingClientRect();

  if (
    bottom >= -50 &&
    top - clientHeight <= 50 &&
    !document.getSelection().toString()
  )
    scrollIntoView(element, scrollOptions);
}
function showMessage(msg, link, level = "info") {
  const popup = $(".popup-msg");
  const html = `<a href="${link}" target="_blank">${msg}</a>`;

  popup.classList.remove("animatePopup");
  clearTimeout(timeout);

  if (link)
    popup.innerHTML =
      typeof DOMPurify !== "undefined" ? DOMPurify.sanitize(html) : html;
  else popup.textContent = msg;

  popup.style.backgroundColor = colors[level];
  void popup.offsetWidth; // NOSONAR

  popup.classList.add("animatePopup");

  timeout = setTimeout(() => {
    popup.classList.remove("animatePopup");
  }, 2500);
}
function getElementIndex(element) {
  if (element) {
    const index = [...element.classList].find((name) =>
      name.startsWith("index")
    );

    return index ? +index.replace("index-", "") : null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const buttons = $All('[class*="button"], button');

  buttons.forEach((button) => {
    button.addEventListener("click", () => button.classList.add("clicked"));
    button.addEventListener("animationend", () =>
      button.classList.remove("clicked")
    );
  });
});
