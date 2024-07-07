const colorThief = new ColorThief();

const convertHEXToRGB = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result.slice(1).map((val) => parseInt(val, 16));
};
const getLuminance = (r, g, b) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return [a[0] * 0.2126, a[1] * 0.7152, a[2] * 0.0722].reduce(
    (a, b) => a + b,
    0
  );
};
const getContrastRatio = (a, b) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const isReadable = ([r, g, b]) => {
  const luminanceBackground = getLuminance(r, g, b);
  const luminanceBlack = 0;
  const textColor = getComputedStyle(document.documentElement).getPropertyValue(
    "--text-color"
  );
  const luminanceText = getLuminance(...convertHEXToRGB(textColor));

  return (
    getContrastRatio(luminanceBackground, luminanceBlack) >= 3 &&
    getContrastRatio(luminanceBackground, luminanceText) >= 3
  );
};
const changeColor = () => {
  if (!spotify.image) return;

  const img = new Image();
  img.src = spotify.image;
  img.crossOrigin = "Anonymous";

  img.addEventListener("load", () => {
    if (document.documentElement.style.getPropertyValue("--background-color")) {
      document.documentElement.style = null;
      return;
    }
    if (spotify.image !== img.src) return;

    const colors = colorThief.getPalette(img);
    const validColors = colors.filter(isReadable);

    if (!validColors.length) return;

    const selectedColor = random(validColors);

    setProperty("--lyrics-color", "rgb(0, 0, 0, 0.75)");
    setProperty("--highlight-color", "255, 255, 255");
    setProperty("--progress-bar-color", "#fff");
    setProperty("--background-color", `rgb(${selectedColor.join(", ")})`);
    setProperty(
      "--translated-color",
      `rgb(${selectedColor.map((c) => c / 4).join(", ")})`
    );
  });
};
