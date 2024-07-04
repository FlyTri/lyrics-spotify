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
  const progress = spotify.position / 1000;

  return _.findLastIndex(lyrics.data, (obj) => obj.time <= progress);
};
const setLyricsStatus = (text) => {
  clearTimeouts();
  $(".content").innerHTML = "";

  const element = document.createElement("p");

  element.classList.add("lyrics", "status");
  element.textContent = text;
  $(".content").appendChild(element);
};
const writeContent = async (obj, element) => {
  if (!currentIndex() && obj.wait) {
    const first = lyrics.data[1].time * 1000;
    const wait = first - spotify.position - 2000;

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
  } else if (obj.wait) {
    element.textContent = "";
  } else {
    element.textContent = obj.text || "♫";
  }
};
const writeTranslates = () => {
  const lines = $All(".translated");

  if (lines.length) {
    _.each(lines, (element) => element.remove());
    localStorage.setItem("translate", false);
  } else {
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
  }

  localStorage.setItem("translate", true);
};
const writeLyrics = () => {
  $(".content").innerHTML = "";

  if (lyrics.message) return setLyricsStatus(lyrics.message);
  if (lyrics.type === "INSTRUMENTAL")
    return setLyricsStatus("Hãy tận hưởng những giai điệu tuyệt vời~");
  if (lyrics.type === "DJ") return setLyricsStatus("Quẩy lên nào! 🎧");
  if (lyrics.type === "NO_RESULT")
    return setLyricsStatus("Có lẽ bạn phải đoán lời bài hát...");

  const translateBtn = $(".translate");
  const lyricsToWrite = _.clone(lyrics.data);

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      let p = document.createElement("p");

      p.classList.add("lyrics");

      _.each(lyricsToWrite, (obj, index) => {
        if (obj.new) {
          appendChild(".content", p);

          p = document.createElement("p");

          p.classList.add("lyrics");
        }

        const span = document.createElement("span");

        span.classList.add(`index-${index}`);
        writeContent(obj, span);
        p.appendChild(span);

        if (!lyricsToWrite[index + 1]) appendChild(".content", p);
      });
      break;
    }
    case "LINE_SYNCED": {
      _.each(lyricsToWrite, (obj, index) => {
        const element = document.createElement("p");

        element.classList.add("lyrics", `index-${index}`);
        writeContent(obj, element);
        appendChild(".content", element);
      });
      break;
    }
    case "NOT_SYNCED": {
      _.each(lyricsToWrite, (obj) => {
        const element = document.createElement("p");

        element.classList.add("lyrics", "highlight");
        writeContent(obj, element);
        appendChild(".content", element);
      });
      break;
    }
  }

  const element = document.createElement("p");

  element.classList.add("source");
  element.textContent = lyrics.source;
  appendChild(".content", element);

  if (lyrics.translated.length) {
    translateBtn.classList.remove("disabled");

    if (localStorage.getItem("translate") === "true") writeTranslates();
  }

  update();
};
const update = () => {
  clearTimeouts();

  if (!spotify.name) {
    $(".content").innerHTML = "";
    return;
  }

  if (!lyrics.data || lyrics.type === "NOT_SYNCED") return;

  if (playing) clearHighlights();

  const now = spotify.position / 1000;
  const currIndex = currentIndex();
  const nextLyrics = _.filter(lyrics.data, (obj) => obj.time > now);
  const currentLine = $(`.index-${currIndex}`);

  currentLine.classList.add("highlight");
  
  if (currIndex && lyrics.data[0].wait) $(".index-0")?.remove();
  if (lyrics.type === "TEXT_SYNCED") {
    const words = currentLine.parentElement.children;
    const played = _.slice(words, 0, _.indexOf(words, currentLine));
    const firstWord = lyrics.data[getElementIndex(words[0])];

    _.forEach(played, (element) => element.classList.add("highlight"));

    if (firstWord.end > now) currentLine.parentElement.classList.add("active");
  }
  scrollIntoView(
    lyrics.type === "TEXT_SYNCED" ? currentLine.parentElement : currentLine,
    false
  );

  if (!playing) return;

  if (!currIndex && lyrics.data[0].wait) {
    const wait = lyrics.data[1].time * 1000 - now * 1000 - 2000;

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
    case "TEXT_SYNCED":
    case "LINE_SYNCED": {
      currentLine.parentElement.classList.add("active");

      _.each(nextLyrics, (lyric, index) => {
        index += currIndex + 1;

        const newElement = lyric.new || lyrics.type === "LINE_SYNCED";

        if (lyric.end)
          timeouts.push(
            setTimeout(
              () =>
                $All(".highlight").forEach((element) =>
                  element.parentElement.classList.remove("active")
                ),
              (lyric.end - now) * 1000
            )
          );

        timeouts.push(
          setTimeout(() => {
            if (newElement) clearHighlights();

            const currentLine = $(`.index-${index}`);

            _.each($All("p"), (i) => i.classList.remove("active"));
            currentLine.parentElement.classList.add("active");
            currentLine.classList.add("highlight");

            if (newElement) scrollIntoView(currentLine);
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

    document.title = "Lời bài hát";
    document.documentElement.style.setProperty("--progress-bar-width", "0%");
    $(".title").textContent = "Tên bài hát";
    $(".artists").textContent = "Tên nghệ sĩ";

    return setLyricsStatus(
      navigator.onLine ? "Một không gian tĩnh lặng :)" : "Ngoại tuyến :("
    );
  }

  document.title = data.playing ? "Đang phát" : "Đã tạm dừng";

  if (data.type !== "track")
    switch (data.type) {
      case "episode":
        return setLyricsStatus("Đang phát podcast");
      case "ad":
        return setLyricsStatus("Đang phát quảng cáo");
      case "unknown":
        return setLyricsStatus("(._.) Không rõ bạn đang phát gì");
    }

  $(".progress-bar").style.width = `${
    ((data.position + _.toNumber(localStorage.getItem("count"))) /
      data.duration) *
    100
  }%`;

  $(".title").innerHTML = data.innerHTMLname;
  $(".artists").innerHTML = data.innerHTMLartists;

  if (data.name && spotify.id !== data.id) {
    document.documentElement.style = null;
    spotify = data;
    playing = data.playing;

    const translateBtn = $(".translate");

    changeColor(spotify);
    translateBtn.classList.add("disabled");
    setLyricsStatus("Đang tải...");

    lyrics = await axios(`/api/lyrics`, {
      params: {
        name: data.name,
        id: data.id,
        album: data.album,
        artist: data.artists,
        duration: data.duration,
      },
    })
      .then((response) => response.data)
      .catch(() => ({ message: "Không thể gửi yêu cầu" }));

    return writeLyrics();
  }
  spotify = data;
  playing = data.playing;

  if (
    spotify.name &&
    lyrics.type !== "NOT_SYNCED" &&
    lyrics.data?.[0].wait &&
    !currentIndex()
  )
    writeLyrics();

  update();
};
