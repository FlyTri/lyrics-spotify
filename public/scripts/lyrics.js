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
  if (data[0].time) data.unshift({ text: "...", index: -1, time: 0 });

  return data;
};
const setLyricsStatus = (text) => {
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  const element = document.createElement("p");
  element.classList.add("lyrics", "highlight");
  element.textContent = text;
  document.querySelector(".content").appendChild(element);
};
const writeLyrics = () => {
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());
  if (lyrics) {
    lyrics.map((obj) => {
      const element = document.createElement("p");
      element.classList.add("lyrics", `index-${obj.index}`);
      element.textContent = obj.text || "♪";
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
  const before = lyrics.filter((obj) => obj.time <= now);
  const nextLyric = lyrics.filter((obj) => obj.time >= now);

  const currentLine = document.querySelector(
    `.index-${before[before.length - 1].index}`
  );
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
