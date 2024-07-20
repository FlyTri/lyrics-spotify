function changeBackground(force) {
  const body = $("body");

  if (!spotify.image) {
    body.style.backgroundImage = null;

    return;
  }

  if (force) {
    body.style.backgroundImage = `url(${spotify.image})`;

    return;
  }

  if (body.style.backgroundImage) body.style.backgroundImage = null;
  else body.style.backgroundImage = `url(${spotify.image})`;
}
