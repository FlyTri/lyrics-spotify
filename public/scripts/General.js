let timeout = null;
const scrollOptions = {
  time: 500,
  ease: (n) => n,
  maxSynchronousAlignments: 1,
};

/**
 @param {string} query
 @returns {Element | null}
 */
const $ = (query) => document.querySelector(query);
/**
 @param {string} query
 @returns {NodeList}
 */
const $All = (query) => document.querySelectorAll(query);

/**
 @param {array} array
 @returns {*}
 */
function random(array) {
  const index = Math.floor(Math.random() * array.length);

  return array[index];
}

/**
 @param {Element} element
 @param {boolean} check
 */
const scrollToCenter = (element, check = true) => {
  if (element.classList.contains("highlight"))
    switch (lyrics.type) {
      case "TEXT_SYNCED":
        element = element.parentElement;
        break;
      case "NOT_SYNCED":
        return;
    }

  if (!check) return scrollIntoView(element, scrollOptions);
  if (!document.getSelection().toString())
    scrollIntoView(element, scrollOptions);
};

const appendChild = (query, element) => $(query).appendChild(element);

/**
 * @param {string} msg
 */
const showMessage = (msg, level = "info", html = false) => {
  const popup = $(".popup-msg");

  popup.classList.remove("animatePopup");
  clearTimeout(timeout);

  popup[html ? "innerHTML" : "textContent"] = msg;
  popup.style.backgroundColor = getProperty(`--level-${level}`);

  popup.classList.add("animatePopup");

  timeout = setTimeout(() => {
    popup.classList.remove("animatePopup");
  }, 2500);
};

const getElementIndex = (element) => {
  if (element) {
    const index = [...element.classList].find((name) =>
      name.startsWith("index")
    );

    return index ? +index.replace("index-", "") : null;
  }
};

/**
 @param {string} name 
 */
const getProperty = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name);

const setProperty = (...options) =>
  document.documentElement.style.setProperty(...options);

document.addEventListener("DOMContentLoaded", () => {
  const buttons = $All('[class*="button"], button');

  buttons.forEach((button) => {
    button.addEventListener("click", () => button.classList.add("clicked"));
    button.addEventListener("animationend", () =>
      button.classList.remove("clicked")
    );
  });
});
