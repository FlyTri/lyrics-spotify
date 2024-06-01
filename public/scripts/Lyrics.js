let timeouts = [];
let lyrics = {};
let spotify = {};
let playing = false;

const colorThief = new ColorThief();

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
const writeLyrics = () => {
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  if (typeof lyrics === "string") setLyricsStatus(lyrics);
  else {
    const translateBtn = document.querySelector(".translate");

    switch (lyrics.type) {
      case "TEXT_SYNCED": {
        lyrics.data.forEach((obj) => {
          const element = document.createElement("p");

          element.classList.add("lyrics");
          obj.forEach(({ text, time, index }) => {
            const span = document.createElement("span");
            span.classList.add(`index-${index}`);

            if (index === -1 && currentIndex() === -1) {
              span.textContent = "⬤ ⬤ ⬤ ⬤";
            } else if (index === -1) {
              span.textContent = "";
            } else {
              span.textContent = text || "♪";
            }
            element.appendChild(span);
          });

          document.querySelector(".content").appendChild(element);
        });
        break;
      }
      case "LINE_SYNCED": {
        lyrics.data.forEach((obj) => {
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
        break;
      }
      case "NOT_SYNCED": {
        lyrics.data.forEach((obj) => {
          const element = document.createElement("p");
          element.classList.add("lyrics", "highlight");
          element.textContent = obj.text;

          document.querySelector(".content").appendChild(element);
        });
        break;
      }
    }

    if (lyrics.translated?.length) {
      translateBtn.classList.remove("disabled");
      if (localStorage.getItem("translate") === "true") writeTranslates();
    }
  }
};
const writeTranslates = () => {
  const lines = document.querySelectorAll(".translated");

  if (lines.length) {
    lines.forEach((element) => element.remove());
    localStorage.setItem("translate", false);
  } else {
    document.querySelectorAll(".lyrics").forEach((element) => {
      const translated = lyrics.translated.find(
        (obj) => obj.original === element.textContent
      );

      if (translated) {
        const p = document.createElement("p");

        p.classList.add("translated");
        p.textContent = translated.text;
        element.appendChild(p);
      }
    });
    localStorage.setItem("translate", true);
  }

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
      (flatted[1].time * 1000 - (DateNow() - spotify.timestamps.start)) / 4;
    [3, 2, 1, 0].forEach((number, index) =>
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
        nextLyrics
          .filter((lyric) => lyric.text != " ")
          .forEach((lyric) => {
            timeouts.push(
              setTimeout(() => {
                if (!playing) return;

                document
                  .querySelectorAll("span")
                  .forEach((i) => i.classList.remove("highlight"));
                document
                  .querySelectorAll("p")
                  .forEach((i) => i.classList.remove("bold"));
                const currentLine = document.querySelector(
                  `.index-${lyric.index}`
                );
                currentLine.parentElement.classList.add("bold");

                currentLine.classList.add("highlight");
                scrollIntoView(currentLine.parentElement);
              }, (lyric.time - now) * 1000)
            );
          });
        break;
      }
      case "LINE_SYNCED": {
        nextLyrics.forEach((lyric) => {
          timeouts.push(
            setTimeout(() => {
              if (!playing) return;

              document
                .querySelectorAll("p")
                .forEach((i) => i.classList.remove("highlight"));
              const currentLine = document.querySelector(
                `.index-${lyric.index}`
              );

              currentLine.classList.add("highlight");
              scrollIntoView(currentLine);
            }, (lyric.time - now) * 1000)
          );
        });
        break;
      }
    }
  }
};
const handleData = async ({ d }) => {
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

    const translateBtn = document.querySelector(".translate");
    spotify = d.spotify;
    playing = d.listening_to_spotify;
    const params = new URLSearchParams({
      name: d.spotify.song,
      id: d.spotify.track_id,
      album: d.spotify.album,
      artist: d.spotify.artist,
      duration: d.spotify.timestamps.end - d.spotify.timestamps.start,
    }).toString();

    translateBtn.classList.add("disabled");
    timeouts.forEach(clearTimeout);
    timeouts = [];
    setLyricsStatus("Đang tải...");

    lyrics = await fetch("/api/lyrics?" + params)
      .then((response) =>
        response.json().then((data) => {
          if (data.message) return data.message;

          return data;
        })
      )
      .catch(() => "Không thể gửi yêu cầu");

    writeLyrics();

    const img = new Image();
    img.src = d.spotify.album_art_url;
    img.crossOrigin = "Anonymous";

    img.addEventListener("load", () => {
      const lighter = (n, percent = 50) =>
        Math.min(255, Math.floor(n + (255 - n) * (percent / 100)));
      const darker = (n, percent = 70) => Math.floor(n * (1 - percent / 100));
      const colors = colorThief
        .getPalette(img)
        .filter(
          ([r, g, b]) =>
            !["0,0,0", "255,255,255"].includes(String) &&
            0.299 * r + 0.587 * g + 0.114 * b > 112.5 &&
            0.299 * r + 0.587 * g + 0.114 * b < 168.75
        );
      if (!colors.length)
        return log("COLORS", "Not suitable", "All colors are too dark");

      const [r, g, b] = colors[Math.floor(Math.random() * colors.length)];
      const textR = darker(r);
      const textG = darker(g);
      const textB = darker(b);

      document.documentElement.style.setProperty(
        "--background-color",
        `rgb(${r}, ${g}, ${b})`
      );
      document.documentElement.style.setProperty(
        "--highlight-color",
        0.299 * r + 0.587 * g + 0.114 * b < 128 ? "white" : "black"
      );
      document.documentElement.style.setProperty(
        "--text-bold-color",
        `rgb(${lighter(r, 40)}, ${lighter(g, 40)}, ${lighter(b, 40)})`
      );
      document.documentElement.style.setProperty(
        "--lyrics-color",
        `rgb(${textR}, ${textG}, ${textB})`
      );
      document.documentElement.style.setProperty(
        "--translated-color",
        `rgb(${darker(r, 80)}, ${darker(g, 60)}, ${darker(b, 60)})`
      );
    });
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
