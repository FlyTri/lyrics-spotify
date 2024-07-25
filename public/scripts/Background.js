function changeBackground(image) {
  const body = document.body;

  if (image) {
    body.style.backgroundImage = `url(${image})`;
  } else if (image === null) {
    body.style.backgroundImage = null;
  } else {
    body.style.backgroundImage = spotify.image ? `url(${spotify.image})` : null;
  }
}
