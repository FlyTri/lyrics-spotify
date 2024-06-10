const colorThief = new ColorThief();

const convertHEXToRGB = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
};
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
  const luminanceText = getLuminance(
    ...convertHEXToRGB(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--text-color"
      )
    )
  );

  return (
    getContrastRatio(luminanceBackground, luminanceBlack) >= 3 &&
    getContrastRatio(luminanceBackground, luminanceText) >= 3
  );
};
const changeColor = () => {
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
    const valid = colors.filter((background) => isReadable(background));

    log(
      "COLORS",
      "VALID",
      "aqua",
      [`%c  %c `.repeat(valid.length)],
      ...valid
        .map((color) => [`background: rgb(${color.join(", ")});`, ""])
        .flat(Infinity)
    );

    if (!valid.length) return;

    const color = valid[Math.floor(Math.random() * valid.length)];

    document.documentElement.style.setProperty("--lyrics-color", "#000");
    document.documentElement.style.setProperty(
      "--highlight-color",
      "var(--text-color)"
    );
    document.documentElement.style.setProperty("--progress-bar-color", "#fff");
    document.documentElement.style.setProperty(
      "--background-color",
      `rgb(${color.join(", ")})`
    );
    document.documentElement.style.setProperty(
      `--background-color-transparent`,
      `rgb(${color.join(", ")}, 0)`
    );
    document.documentElement.style.setProperty(
      "--translated-color",
      `rgb(${color.map((c) => c / 4).join(", ")})`
    );
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute("content", `rgb(${color.map((c) => c / 2).join(", ")})`);
  });
};
