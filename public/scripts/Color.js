const colorThief = new ColorThief();

const getLuminance = (r, g, b) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};
const getContrastRatio = (a, b) => {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const isReadable = ([r, g, b]) => {
  const luminanceBackground = getLuminance(r, g, b);
  const luminanceBlack = 0;
  const luminanceWhite = 1;

  return (
    getContrastRatio(luminanceBackground, luminanceBlack) >= 3 &&
    getContrastRatio(luminanceBackground, luminanceWhite) >= 3
  );
};
const changeColor = () => {
  const img = new Image();
  img.src = spotify.album_art_url;
  img.crossOrigin = "Anonymous";

  img.addEventListener("load", () => {
    if (spotify.album_art_url !== img.src) return;

    const colors = colorThief
      .getPalette(img)
      .filter((background) => isReadable(background));
    console.log(colorThief.getPalette(img));
    if (!colors.length) return;

    const color = colors[Math.floor(Math.random() * colors.length)];

    document.documentElement.style.setProperty("--lyrics-color", "#000");
    document.documentElement.style.setProperty("--highlight-color", "#fff");
    document.documentElement.style.setProperty("--progress-bar-color", "#fff");
    document.documentElement.style.setProperty(
      "--background-color",
      `rgb(${color.join(", ")})`
    );
    document.documentElement.style.setProperty(
      "--translated-color",
      `rgb(${color.map((c) => c / 4).join(", ")})`
    );
  });
};
