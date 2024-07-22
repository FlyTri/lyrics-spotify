let timeout = null;
const scrollOptions = {
  time: 500,
  ease: (n) => n,
  maxSynchronousAlignments: 1,
};

function $(query) {
  return document.querySelector(query);
}
function $All(query) {
  return document.querySelectorAll(query);
}
function append(query, element) {
  $(query).append(element);
}
function random(array) {
  const index = Math.floor(Math.random() * array.length);

  return array[index];
}
function scrollToCenter(element, check = true) {
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

  popup.classList.remove("animatePopup");
  clearTimeout(timeout);

  if (link) popup.innerHTML = `<a href="${link}" target="_blank">${msg}</a>`;
  else popup.textContent = msg;
  popup.style.backgroundColor = getProperty(`--level-${level}`);
  void popup.offsetWidth;

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
const getProperty = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name);

const setProperty = (...options) => document.body.style.setProperty(...options);

document.addEventListener("DOMContentLoaded", () => {
  const buttons = $All('[class*="button"], button');

  buttons.forEach((button) => {
    button.addEventListener("click", () => button.classList.add("clicked"));
    button.addEventListener("animationend", () =>
      button.classList.remove("clicked")
    );
  });
});
