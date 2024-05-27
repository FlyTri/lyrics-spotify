const timeouts = [];
let lyrics;

setInterval(() => {
  const width = document.querySelector(".progress-bar").style.width;

  if (playing) {
    document.querySelector(".progress-bar").style.width = `${
      ((Date.now() - spotify.timestamps.start) /
        (spotify.timestamps.end -
          Date.now() +
          (Date.now() - spotify.timestamps.start))) *
      100
    }%`;
  } else {
    if (width != "0%")
      document.querySelector(".progress-bar").style.width = "0%";
  }
});
const formatLyrics = async (lyrics) => {
  const data = lyrics.map((lr, i) => ({
    text: lr.text,
    index: i,
    time: lr.time.total,
  }));
  if (data[0].time) data.unshift({ index: -1, time: 0 });

  return data;
};
const setLyricsStatus = (text) => {
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  const element = document.createElement("p");
  element.classList.add("lyrics", "highlight");
  element.textContent = text;
  document.querySelector(".content").appendChild(element);
};
const currentIndex = () => {
  const now = (Date.now() - spotify.timestamps.start) / 1000;
  const before = lyrics.filter((obj) => obj.time <= now);

  return before[before.length - 1].index;
};
const writeLyrics = () => {
  console.log(currentIndex());
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());
  if (lyrics) {
    lyrics.map((obj) => {
      console.log(obj.index === -1 && currentIndex() === -1);
      const element = document.createElement("p");
      element.classList.add("lyrics", `index-${obj.index}`);
      element.textContent =
        obj.index === -1 && currentIndex() === -1
          ? "⬤ ⬤ ⬤ ⬤"
          : obj.index === -1
          ? ""
          : obj.text || "♪";
      document.querySelector(".content").appendChild(element);
    });
  }
};
const update = () => {
  timeouts.map(clearTimeout);
  if (!playing)
    return document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  if (!lyrics) return setLyricsStatus("Hmm... Bạn phải đoán chúng rồi!");

  const now = (Date.now() - spotify.timestamps.start) / 1000;
  const nextLyric = lyrics.filter((obj) => obj.time >= now);

  const currentLine = document.querySelector(`.index-${currentIndex()}`);
  if (currentIndex() === -1) {
    const wait =
      (lyrics[1].time * 1000 - (Date.now() - spotify.timestamps.start)) / 4;
    [3, 2, 1, 0].map((number, index) =>
      timeouts.push(
        setTimeout(() => {
          currentLine.textContent = " ⬤ ".repeat(number);
        }, wait * (index + 1))
      )
    );
  }
  document
    .querySelectorAll("p")
    .forEach((i) => i.classList.remove("highlight"));
  currentLine.classList.add("highlight");
  currentLine.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  if (playing) {
    nextLyric.map((lyric) => {
      timeouts.push(
        setTimeout(() => {
          if (!playing) return;

          document
            .querySelectorAll("p")
            .forEach((i) => i.classList.remove("highlight"));
          const currentLine = document.querySelector(`.index-${lyric.index}`);
          const rect = currentLine.getBoundingClientRect();

          currentLine.classList.add("highlight");
          if (rect.bottom >= -50)
            currentLine.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        }, (lyric.time - now) * 1000)
      );
    });
  }
};
