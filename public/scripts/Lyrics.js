let timeouts = [];
let lyrics = {};
let spotify = {};
let playing = false;

const scrollIntoView = (element, check = true) => {
  if (!element) return;
  if (!check)
    return element.scrollIntoView({ behavior: "smooth", block: "center" });

  const { clientHeight } = document.body;
  const elementRectBottom = element.getBoundingClientRect().bottom;

  if (elementRectBottom >= -50 && elementRectBottom <= clientHeight)
    element.scrollIntoView({ behavior: "smooth", block: "center" });
};

const setLyricsStatus = (text) => {
  timeouts.forEach(clearTimeout);
  timeouts = [];
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  const element = document.createElement("p");
  element.classList.add("lyrics", "highlight");
  element.textContent = text;
  document.querySelector(".content").appendChild(element);
};
const currentIndex = () => {
  const now = (DateNow() - spotify.timestamps.start) / 1000;
  const flatted = lyrics.data.flat(Infinity);
  const before = now < 0 ? flatted : flatted.filter((obj) => obj.time <= now);

  return before[before.length - 1].index;
};
const writeContent = (index, text, element) => {
  if (index === -1 && currentIndex() === -1) {
    element.textContent = "⬤ ⬤ ⬤ ⬤";
  } else if (index === -1) {
    element.textContent = "";
  } else {
    element.textContent = text || "♪";
  }
};
const writeLyrics = () => {
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  if (lyrics.message) return setLyricsStatus(lyrics.message);
  const translateBtn = document.querySelector(".translate");

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      for (const obj of lyrics.data) {
        const element = document.createElement("p");

        element.classList.add("lyrics");
        for (const { text, index } of obj) {
          const span = document.createElement("span");
          span.classList.add(`index-${index}`);
          writeContent(index, text, span);
          element.appendChild(span);
        }

        document.querySelector(".content").appendChild(element);
      }
      break;
    }
    case "LINE_SYNCED": {
      for (const obj of lyrics.data) {
        const element = document.createElement("p");
        element.classList.add("lyrics", `index-${obj.index}`);
        writeContent(obj.index, obj.text, element);

        document.querySelector(".content").appendChild(element);
      }
      break;
    }
    case "NOT_SYNCED": {
      for (const obj of lyrics.data) {
        const element = document.createElement("p");
        element.classList.add("lyrics", "highlight");
        element.textContent = obj.text;

        document.querySelector(".content").appendChild(element);
      }
      break;
    }
  }

  if (lyrics.translated?.length) {
    translateBtn.classList.remove("disabled");
    if (localStorage.getItem("translate") === "true") writeTranslates();
  }
};
const writeTranslates = () => {
  const lines = document.querySelectorAll(".translated");

  if (lines.length) {
    lines.forEach((element) => element.remove());
    return localStorage.setItem("translate", false);
  }

  for (const element of document.querySelectorAll(".lyrics")) {
    const translated = lyrics.translated.find(
      (obj) => obj.original === element.textContent
    );

    if (translated) {
      const p = document.createElement("p");

      p.classList.add("translated");
      p.textContent = translated.text;

      element.appendChild(p);
    }
  }

  localStorage.setItem("translate", true);
  scrollIntoView(document.querySelector(".highlight"), false);
};
const update = (adjust = false) => {
  timeouts.forEach(clearTimeout);
  timeouts = [];

  if (!playing && !adjust)
    return document.querySelectorAll(".lyrics").forEach((i) => i.remove());
  if (!lyrics.data || lyrics.type === "NOT_SYNCED") return;

  const now = (DateNow() - spotify.timestamps.start) / 1000;
  const flatted = lyrics.data.flat(Infinity);
  const nextLyrics = flatted.filter((obj) => obj.time >= now);
  const currentLine = document.querySelector(`.index-${currentIndex()}`);

  if (currentIndex() === -1) {
    const wait =
      (flatted[1].time * 1000 - (DateNow() - spotify.timestamps.start)) / 3;

    [2, 1, 0].forEach((number, index) =>
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
  document.querySelectorAll("p").forEach((i) => i.classList.remove("bold"));
  currentLine.classList.add("highlight");

  if (lyrics.type === "TEXT_SYNCED")
    currentLine.parentElement.classList.add("bold");

  scrollIntoView(currentLine, false);

  if (playing) {
    switch (lyrics.type) {
      case "TEXT_SYNCED": {
        for (const lyric of nextLyrics.filter((lyric) => lyric.text != " ")) {
          timeouts.push(
            setTimeout(() => {
              if (!playing) return;
              if (lyric.newLine)
                document
                  .querySelectorAll("span")
                  .forEach((i) => i.classList.remove("highlight"));

              const currentLine = document.querySelector(
                `.index-${lyric.index}`
              );

              document
                .querySelectorAll("p")
                .forEach((i) => i.classList.remove("bold"));
              currentLine.parentElement.classList.add("bold");
              currentLine.classList.add("highlight");
              scrollIntoView(currentLine.parentElement);
            }, (lyric.time - now) * 1000)
          );
        }
        break;
      }
      case "LINE_SYNCED": {
        for (const lyric of nextLyrics) {
          timeouts.push(
            setTimeout(() => {
              if (!playing) return;

              const currentLine = document.querySelector(
                `.index-${lyric.index}`
              );

              document
                .querySelectorAll("p")
                .forEach((i) => i.classList.remove("highlight"));
              currentLine.classList.add("highlight");
              scrollIntoView(currentLine);
            }, (lyric.time - now) * 1000)
          );
        }
        break;
      }
    }
  }
};
const handleData = async ({ d }) => {
  timeouts.forEach(clearTimeout);
  timeouts = [];

  if (d.discord_status === "offline" || !d.spotify) {
    document.documentElement.style = null;
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
    document.documentElement.style = null;
    spotify = d.spotify;
    playing = d.listening_to_spotify;

    const translateBtn = document.querySelector(".translate");
    const params = new URLSearchParams({
      name: d.spotify.song,
      id: d.spotify.track_id,
      album: d.spotify.album,
      artist: d.spotify.artist,
      duration: d.spotify.timestamps.end - d.spotify.timestamps.start,
    }).toString();

    translateBtn.classList.add("disabled");
    setLyricsStatus("Đang tải...");

    fetch(`/api/colors?id=` + d.spotify.album_art_url.split("/").pop())
      .then((response) =>
        response.json().then((data) => {
          if (data.message) return;

          const { text, background, translated } = data;
          document.documentElement.style.setProperty("--lyrics-color", text);
          document.documentElement.style.setProperty(
            "--highlight-color",
            "#fff"
          );
          document.documentElement.style.setProperty(
            "--progress-bar-color",
            "#fff"
          );
          document.documentElement.style.setProperty(
            "--background-color",
            background
          );
          document.documentElement.style.setProperty(
            "--translated-color",
            translated
          );
        })
      )
      .catch(() => null);

    lyrics = await fetch("/api/lyrics?" + params)
      .then((response) => response.json())
      .catch(() => ({ message: "Không thể gửi yêu cầu" }));
    writeLyrics();
  }
  spotify = d.spotify;
  playing = d.listening_to_spotify;

  if (
    playing &&
    lyrics.type !== "NOT_SYNCED" &&
    lyrics.data &&
    currentIndex() === -1
  )
    writeLyrics();
  
  update();
};
