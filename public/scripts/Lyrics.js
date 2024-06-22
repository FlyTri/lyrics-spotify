let timeouts = [];
let lyrics = {};
let spotify = {};
let playing = false;

const clearTimeouts = () => {
  _.each(timeouts, clearTimeout);
  timeouts = [];
};
const clearHighlights = () => {
  _.each($All(".highlight"), (el) => {
    el.className = el.className.replace("highlight", "");
  });
};
const currentIndex = () => {
  const current = _.findLast(
    _.flattenDeep(lyrics.data),
    (obj) => obj.time <= spotify.progress() / 1000
  );
  return current.index;
};
const setLyricsStatus = (text) => {
  clearTimeouts();
  $(".content").innerHTML = "";

  const element = document.createElement("p");
  element.classList.add("lyrics", "highlight");
  element.style.textAlign = "center";
  element.textContent = text;
  $(".content").appendChild(element);
};
const writeContent = (index, text, element) => {
  if (!index && !currentIndex()) {
    const first = _.flattenDeep(lyrics.data)[1].time * 1000;
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
  const lines = $All(".translated");

  if (lines.length) {
    _.each(lines, (element) => element.remove());
    return localStorage.setItem("translate", false);
  }

  _.each($All(".lyrics"), (element) => {
    const translated = _.find(lyrics.translated, {
      original: element.textContent,
    });

    if (translated) {
      const p = document.createElement("p");
      p.classList.add("translated");
      p.textContent = translated.text;
      element.appendChild(p);
    }
  });

  localStorage.setItem("translate", true);
};
const writeLyrics = (callUpdate) => {
  _.each($All(".lyrics"), (i) => i.remove());

  if (lyrics.message) return setLyricsStatus(lyrics.message);

  const translateBtn = $(".translate");
  const lyricsToWrite = _.clone(lyrics.data);

  if (lyrics.type !== "NOT_SYNCED" && currentIndex() !== 0)
    lyricsToWrite.shift();

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      _.each(lyricsToWrite, (obj) => {
        const element = document.createElement("p");
        element.classList.add("lyrics");

        _.each(obj, ({ text, index }) => {
          const span = document.createElement("span");
          span.classList.add(`index-${index}`);
          writeContent(index, text, span);
          element.appendChild(span);
        });

        appendChild(".content", element);
      });
      break;
    }
    case "LINE_SYNCED": {
      _.each(lyricsToWrite, (obj) => {
        const element = document.createElement("p");
        element.classList.add("lyrics", `index-${obj.index}`);
        writeContent(obj.index, obj.text, element);
        appendChild(".content", element);
      });
      break;
    }
    case "NOT_SYNCED": {
      _.each(lyricsToWrite, (obj) => {
        const element = document.createElement("p");
        element.classList.add("lyrics", "highlight");
        writeContent(1, obj.text, element);
        appendChild(".content", element);
      });
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

  if (!spotify.name) {
    return _.each($All(".lyrics"), (i) => i.remove());
  }
  if (!lyrics.data || lyrics.type === "NOT_SYNCED") return;

  clearHighlights();

  const now = spotify.progress() / 1000;
  const flatted = _.filter(
    _.flattenDeep(lyrics.data),
    (obj) => obj.text !== " "
  );
  const currIndex = currentIndex();
  const nextLyrics = _.filter(flatted, (obj) => obj.time > now);
  const currentLine = $(`.index-${currIndex}`);

  if (!currentLine) return;

  if (lyrics.type === "TEXT_SYNCED") {
    const playedWords = _.chain(lyrics.data)
      .find((arr) => _.some(arr, (obj) => obj.index === currIndex))
      .filter((obj) => obj.index < currIndex)
      .value();

    _.each(playedWords, ({ index }) => {
      const word = $(`.index-${index}`);
      word?.classList.add("highlight");
    });
  }

  currentLine.classList.add("highlight");
  scrollIntoView(
    lyrics.type === "TEXT_SYNCED" ? currentLine.parentElement : currentLine,
    false
  );

  if (!playing) return;
  if (!currIndex) {
    const wait = flatted[1].time * 1000 - now * 1000 - 2000;

    _.each(["● ●", "●", false], (state, index) => {
      if (wait + index * 1000 > 0)
        timeouts.push(
          setTimeout(() => {
            if (!state) {
              const line =
                lyrics.type === "TEXT_SYNCED"
                  ? currentLine.parentElement
                  : currentLine;

              line.remove();
              return;
            }
            currentLine.textContent = state;
          }, wait + index * 1000)
        );
    });
  }

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      currentLine.parentElement.classList.add("bold");

      _.each(nextLyrics, (lyric) => {
        timeouts.push(
          setTimeout(() => {
            if (lyric.newLine)
              _.each($All("span"), (i) =>
                i.classList.remove("highlight")
              );

            const currentLine = $(`.index-${lyric.index}`);

            _.each($All("p"), (i) =>
              i.classList.remove("bold")
            );
            currentLine.parentElement.classList.add("bold");
            currentLine.classList.add("highlight");
            if (lyric.newLine) scrollIntoView(currentLine.parentElement);
          }, (lyric.time - now) * 1000)
        );
      });
      break;
    }
    case "LINE_SYNCED": {
      _.each(nextLyrics, (lyric) => {
        timeouts.push(
          setTimeout(() => {
            const currentLine = $(`.index-${lyric.index}`);
            clearHighlights();
            currentLine.classList.add("highlight");
            scrollIntoView(currentLine);
          }, (lyric.time - now) * 1000)
        );
      });
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
    $(".title").textContent = "Tên bài hát";
    $(".artists").textContent = "Tên nghệ sĩ";

    if (!data.playing)
      return setLyricsStatus(
        navigator.onLine ? "Hiện không phát" : "Ngoại tuyến :("
      );
  }

  if (data.type !== "track")
    switch (data.type) {
      case "episode":
        return setLyricsStatus("Đang phát podcast");
      case "ad":
        return setLyricsStatus("Đang phát quảng cáo");
      case "unknown":
        return setLyricsStatus("(._.) Không rõ bạn đang phát gì");
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
  $(".title").innerHTML = data.innerHTMLname;
  $(".artists").innerHTML = data.innerHTMLartists;

  if (data.name && spotify.id !== data.id) {
    document.documentElement.style = null;
    spotify = data;
    playing = data.playing;

    const translateBtn = $(".translate");
    const options = new URLSearchParams({
      name: data.name,
      id: data.id,
      album: data.album,
      artist: data.artists,
      duration: data.duration,
    });

    changeColor(spotify);
    translateBtn.classList.add("disabled");
    setLyricsStatus("Đang tải...");

    lyrics = await fetch(`/api/lyrics?${options}`)
      .then((response) => response.json())
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
