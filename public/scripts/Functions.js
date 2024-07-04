let timeout = null;

/**
 * @param {string} query
 * @returns {Element | null}
 */
const $ = (query) => document.querySelector(query);
/**
 * @param {string} query
 * @returns {NodeList}
 */
const $All = (query) => document.querySelectorAll(query);

/**
 * @param {Element} element
 * @param {boolean} check
 * @returns
 */
const scrollIntoView = (element, check = true) => {
  if (element.classList.contains("highlight"))
    switch (lyrics.type) {
      case "TEXT_SYNCED":
        element = element.parentElement;
        break;
      case "NOT_SYNCED":
        return;
    }

  if (!check)
    return element.scrollIntoView({ behavior: "smooth", block: "center" });

  const { clientHeight } = document.body;
  const elementRectBottom = element.getBoundingClientRect().bottom;

  if (elementRectBottom >= -50 && elementRectBottom <= clientHeight)
    element.scrollIntoView({ behavior: "smooth", block: "center" });
};

const appendChild = (query, element) =>
  document.querySelector(query).appendChild(element);

const showMessage = (msg) => {
  const popup = $(".popup-msg");

  popup.classList.remove("animatePopup");
  clearTimeout(timeout);
  void popup.offsetWidth; // NOSONAR

  popup.textContent = msg;

  popup.classList.add("animatePopup");

  timeout = setTimeout(() => {
    popup.classList.remove("animatePopup");
  }, 2500);
};

const getElementIndex = (element) => {
  if (element) {
    const index = _.toArray(element.classList).find((name) =>
      name.startsWith("index")
    );

    return index ? Number(index.replace("index-", "")) : null;
  }
};

const getProperty = (value) =>
  getComputedStyle(document.documentElement).getPropertyValue(value);

const setProperty = (...options) =>
  document.documentElement.style.setProperty(...options);
