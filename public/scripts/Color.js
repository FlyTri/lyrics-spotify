const changeColor = (force) => {
  if (!spotify.image) return;

  const body = $("body");

  if (body.style.backgroundImage && !force) background.style = null;
  else body.style.backgroundImage = `url(${spotify.image})`;
};
