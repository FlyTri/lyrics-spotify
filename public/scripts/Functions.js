const scrollIntoView = (element, check = true) => {
  if (!check)
    return element.scrollIntoView({ behavior: "smooth", block: "center" });

  const { clientHeight } = document.body;
  const elementRectBottom = element.getBoundingClientRect().bottom;

  if (elementRectBottom >= -50 && elementRectBottom <= clientHeight)
    element.scrollIntoView({ behavior: "smooth", block: "center" });
};
// const formatTime
const appendChild = (query, element) =>
  document.querySelector(query).appendChild(element);
