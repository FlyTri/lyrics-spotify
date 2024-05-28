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
  } else if (width != "0%")
    document.querySelector(".progress-bar").style.width = "0%";
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
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());
  if (lyrics)
    lyrics.map((obj) => {
      const element = document.createElement("p");
      element.classList.add("lyrics", `index-${obj.index}`);

      if (obj.index === -1 && currentIndex() === -1) {
        element.textContent = "⬤ ⬤ ⬤ ⬤";
      } else if (obj.index === -1) {
        element.textContent = "";
      } else {
        element.textContent = obj.text || "♪";
      }

      document.querySelector(".content").appendChild(element);
    });
};
const update = () => {
  timeouts.map((timeout) => clearTimeout(timeout));
  if (!playing)
    return document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  if (!lyrics) return setLyricsStatus("Hmm... Bạn phải đoán thôi!");

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

  if (playing)
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
};
const handleData = async ({ d }) => {
  if (d.discord_status === "offline" || !d.spotify) {
    spotify = {};
    playing = false;

    document.querySelector(".title").textContent = "Tên bài hát";
    document.querySelector(".artist").textContent = "Tên nghệ sĩ";

    return setLyricsStatus(
      d.discord_status === "offline" ? "Đang offline" : "Hiện không phát"
    );
  }

  document.title = d.listening_to_spotify ? "Đang phát" : "Đã tạm dừng";
  document.querySelector(".title").textContent = d.listening_to_spotify
    ? d.spotify.song
    : "Tên bài hát";
  document.querySelector(".artist").textContent = d.listening_to_spotify
    ? d.spotify.artist.replaceAll(";", ",")
    : "Tên nghệ sĩ";

  if (d.listening_to_spotify && spotify.track_id != d.spotify.track_id) {
    timeouts.map(clearTimeout);
    setLyricsStatus("Đang tải...");
    lyrics = await fetch(
      `/api/lyrics?name=${d.spotify.song}&id=${d.spotify.track_id}`
    )
      .then((response) => response.json().then(formatLyrics))
      .catch(() => null);

    spotify = d.spotify;
    playing = d.listening_to_spotify;

    if (lyrics) writeLyrics();
  }

  spotify = d.spotify;
  playing = d.listening_to_spotify;
  if (lyrics && currentIndex() === -1) writeLyrics();
  update();
};
