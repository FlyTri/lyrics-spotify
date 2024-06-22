let timeout = null;

/**
 *
 * @param {string} query
 * @returns {Element | null}
 */
const $ = (query) => document.querySelector(query);
/**
 * 
 * @param {string} query 
 * @returns {NodeList}
 */
const $All = (query) => document.querySelectorAll(query);

/**
 *
 * @param {Element} element
 * @param {boolean} check
 * @returns
 */
const scrollIntoView = (element, check = true) => {
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
