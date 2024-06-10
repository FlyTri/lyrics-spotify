let timeouts = [];
let lyrics = {};
let spotify = {};
let playing = false;

const clearTimeouts = () => {
  timeouts.forEach(clearTimeout);
  timeouts = [];
};
const clearHighlights = () => {
  document.querySelectorAll(".highlight").forEach((i) => {
    i.classList.remove("highlight");
    i.parentElement.classList.remove("bold");
  });
};
const currentIndex = () => {
  const flatted = lyrics.data.flat(Infinity);
  const before = flatted.filter((obj) => obj.time <= spotify.progress() / 1000);

  return before[before.length - 1].index;
};
const setLyricsStatus = (text) => {
  clearTimeouts();
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  const element = document.createElement("p");

  element.classList.add("lyrics");
  element.style.textAlign = "center";
  element.textContent = text;
  document.querySelector(".content").appendChild(element);
};
const writeContent = (index, text, element) => {
  if (!index && !currentIndex()) {
    const first = lyrics.data.flat(Infinity)[1].time * 1000;
    const wait = first - spotify.progress() - 2000;

    if (wait > 0) {
      element.textContent = "● ● ●";
      return;
    }
    if (wait + 1000 > 0) {
      element.textContent = "● ●";
      return;
    }
    if (wait + 2000 > 0) {
      element.textContent = "●";
      return;
    }
  } else if (!index) {
    element.textContent = "";
  } else {
    element.textContent = text || "♫";
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
};
const writeLyrics = (callUpdate) => {
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  if (lyrics.message) return setLyricsStatus(lyrics.message);
  const translateBtn = document.querySelector(".translate");
  const lyricsToWrite = [...lyrics.data];

  if (lyrics.type !== "NOT_SYNCED" && currentIndex() !== 0)
    lyricsToWrite.shift();

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      for (const obj of lyricsToWrite) {
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
      for (const obj of lyricsToWrite) {
        const element = document.createElement("p");

        element.classList.add("lyrics", `index-${obj.index}`);
        writeContent(obj.index, obj.text, element);
        document.querySelector(".content").appendChild(element);
      }
      break;
    }
    case "NOT_SYNCED": {
      for (const obj of lyricsToWrite) {
        const element = document.createElement("p");

        element.classList.add("lyrics", "highlight");
        writeContent(1, obj.text, element);
        document.querySelector(".content").appendChild(element);
      }
      break;
    }
  }

  if (lyrics.translated?.length) {
    translateBtn.classList.remove("disabled");

    if (localStorage.getItem("translate") === "true") writeTranslates();
  }

  if (callUpdate) update();
};
const update = () => {
  clearTimeouts();

  if (!spotify.name && !adjust)
    return document.querySelectorAll(".lyrics").forEach((i) => i.remove());
  if (!lyrics.data || lyrics.type === "NOT_SYNCED") return;

  clearHighlights();

  const now = spotify.progress() / 1000;
  const flatted = lyrics.data.flat(Infinity);
  const nextLyrics = flatted.filter((obj) => obj.time >= now);
  const currentLine = document.querySelector(`.index-${currentIndex()}`);

  if (!currentLine) return;
  if (lyrics.type === "TEXT_SYNCED") {
    const playedWords = lyrics.data
      .find((arr) => arr.find((obj) => obj.index === currentIndex()))
      .filter((obj) => obj.index < currentIndex());

    for (const { index } of playedWords) {
      const word = document.querySelector(`.index-${index}`);

      word?.classList.add("highlight");
    }
  }

  currentLine.classList.add("highlight");
  scrollIntoView(currentLine, false);

  if (!playing) return;
  if (!currentIndex()) {
    const wait = flatted[1].time * 1000 - now * 1000 - 2000;

    ["● ●", "●", false].forEach((state, index) => {
      if (wait + index * 1000 > 0) {
        timeouts.push(
          setTimeout(() => {
            if (!state) {
              (lyrics.type === "TEXT_SYNCED"
                ? currentLine.parentElement
                : currentLine
              ).remove();
              console.log("delted");
              return;
            }

            currentLine.textContent = state;
          }, wait + index * 1000)
        );
      }
    });
  }

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      currentLine.parentElement.classList.add("bold");

      for (const lyric of nextLyrics) {
        timeouts.push(
          setTimeout(() => {
            if (lyric.newLine)
              document
                .querySelectorAll("span")
                .forEach((i) => i.classList.remove("highlight"));

            const currentLine = document.querySelector(`.index-${lyric.index}`);

            document
              .querySelectorAll("p")
              .forEach((i) => i.classList.remove("bold"));
            currentLine.parentElement.classList.add("bold");
            currentLine.classList.add("highlight");
            if (lyric.newLine) scrollIntoView(currentLine.parentElement);
          }, (lyric.time - now) * 1000)
        );
      }
      break;
    }
    case "LINE_SYNCED": {
      for (const lyric of nextLyrics) {
        timeouts.push(
          setTimeout(() => {
            const currentLine = document.querySelector(`.index-${lyric.index}`);

            clearHighlights();
            currentLine.classList.add("highlight");
            scrollIntoView(currentLine);
          }, (lyric.time - now) * 1000)
        );
      }
      break;
    }
  }
};
const handleData = async (data) => {
  clearTimeouts();
  clearHighlights();

  if (!data.name) {
    document.documentElement.style = null;
    spotify = {};
    playing = false;

    document.documentElement.style.setProperty("--progress-bar-width", "0%");
    document.querySelector(".title").textContent = "Tên bài hát";
    document.querySelector(".artists").textContent = "Tên nghệ sĩ";

    if (!data.playing) return setLyricsStatus("Hiện không phát");
  }

  if (data.type !== "track")
    switch (data.type) {
      case "episode": {
        return setLyricsStatus("Đang phát podcast");
      }
      case "ad": {
        return setLyricsStatus("Đang phát quảng cáo");
      }
      case "unknown": {
        return setLyricsStatus("(._.) Không rõ bạn đang phát gì");
      }
    }

  document.documentElement.style.setProperty(
    "--progress-bar-width",
    `${
      ((data.progress() + Number(localStorage.getItem("count"))) /
        data.duration) *
      100
    }%`
  );

  document.title = data.playing ? "Đang phát" : "Đã tạm dừng";
  document.querySelector(".title").innerHTML = data.innerHTMLname;
  document.querySelector(".artists").innerHTML = data.innerHTMLartists;

  if (data.name && spotify.id !== data.id) {
    document.documentElement.style = null;
    spotify = data;
    playing = data.playing;

    const translateBtn = document.querySelector(".translate");
    const options = new URLSearchParams({
      name: data.name,
      id: data.id,
      album: data.album,
      artist: data.artists,
      duration: data.duration,
    });

    translateBtn.classList.add("disabled");
    setLyricsStatus("Đang tải...");

    changeColor(spotify);
    lyrics = await fetch(`/api/lyrics?${options}`)
      .then((response) => {
        let data = response.json();

        if (data.type === "LINE_SYNCED")
          data = data.map((obj) => !obj.text.trim() && !obj.newLine);

        return data;
      })
      .catch(() => ({ message: "Không thể gửi yêu cầu" }));
    return writeLyrics(true);
  }
  spotify = data;
  playing = data.playing;

  if (
    spotify.name &&
    lyrics.type !== "NOT_SYNCED" &&
    lyrics.data &&
    !currentIndex()
  )
    writeLyrics();

  update();
};
