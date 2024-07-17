let timeouts = [];
let lyrics = {};
let spotify = {};
let playing = false;

const clearTimeouts = () => {
  timeouts.forEach(clearTimeout);
  timeouts = [];
};
const clearHighlights = () => {
  if (lyrics.type === "NOT_SYNCED") return;

  $All(".highlight").forEach((element) =>
    element.classList.remove("highlight")
  );
};
const currentIndex = () =>
  lyrics.data.findLastIndex((obj) => obj.time <= spotify.position);
const setLyricsStatus = (text) => {
  clearTimeouts();
  $(".content").innerHTML = "";

  const element = document.createElement("p");

  element.classList.add("lyrics", "status");
  element.textContent = text;
  $(".content").append(element);
};
const writeContent = (obj, element) => {
  if (obj.wait) {
    const wait = lyrics.data[lyrics.data.indexOf(obj) + 1].time - obj.time;
    const delay = wait / 3;
    const offset = spotify.position - obj.time;
    const time = [delay, delay * 2, delay * 3];
    const position = time.findIndex((n) => offset <= n);
    const animationDelay = offset - delay * position;

    setProperty("--dot-delay", `${delay}ms`);
    element.innerHTML = "";
    [0, 1, 2].forEach((index) => {
      const span = document.createElement("span");

      span.removeAttribute("style");
      span.removeAttribute("ended");
      span.classList.remove("active");
      span.classList.add("dot");

      if (index < position) {
        span.classList.add("active");
        span.setAttribute("ended", "");
      } else if (index === position) {
        span.classList.add("active");
        span.style.animationDelay = `-${animationDelay}ms`;
        if (!playing) span.style.animationPlayState = "paused";
      } else if (index > position && playing) {
        timeouts.push(
          setTimeout(
            () => span.classList.add("active"),
            delay * index - (animationDelay + delay * position)
          )
        );
      } else span.style.animationPlayState = null;

      element.append(span);
    });
  } else {
    element.textContent = obj.text || "♫";
  }
};
const writeTranslates = () => {
  const lines = $All(".translated");
  const highlight = $(".highlight");

  if (highlight) scrollToCenter(highlight, false);
  if (lines.length) {
    lines.forEach((element) => element.remove());
    localStorage.setItem("translate", false);
  } else {
    $All(".lyrics").forEach((element) => {
      const translated = lyrics.translated.find(
        (item) => item.original === element.textContent.replaceAll("  ", " ")
      );

      if (translated) {
        const p = document.createElement("p");

        p.classList.add("translated");
        p.textContent = translated.text;
        element.append(p);
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

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      let p = document.createElement("p");
      p.classList.add("lyrics");

      lyrics.data.forEach((obj, index) => {
        if (obj.new) {
          append(".content", p);
          p = document.createElement("p");
          p.classList.add("lyrics");
        }

        const span = document.createElement("span");
        span.classList.add(`index-${index}`);
        writeContent(obj, span);
        p.append(span);

        if (!lyrics.data[index + 1]) append(".content", p);
      });
      break;
    }
    case "LINE_SYNCED": {
      lyrics.data.forEach((obj, index) => {
        const element = document.createElement("p");
        element.classList.add("lyrics", `index-${index}`);
        writeContent(obj, element);
        append(".content", element);
      });
      break;
    }
    case "NOT_SYNCED": {
      lyrics.data.forEach((obj) => {
        const element = document.createElement("p");
        element.classList.add("lyrics", "highlight");
        writeContent(obj, element);
        append(".content", element);
      });
      break;
    }
  }

  const element = document.createElement("p");
  element.classList.add("source");
  element.textContent = lyrics.source;
  append(".content", element);

  if (lyrics.translated.length) {
    translateBtn.classList.remove("disabled");
    if (localStorage.getItem("translate") === "true") writeTranslates();
  }

  update();
};

/**
 *
 * @param {HTMLElement} currentLine
 * @param {*} index
 */
const updateInterlude = (currentLine, index) => {
  writeContent(lyrics.data[index], currentLine);
};
const update = () => {
  clearTimeouts();

  if (!spotify.id) {
    $(".content").innerHTML = "";

    return;
  }
  if (!lyrics || lyrics.type === "NOT_SYNCED") return;
  if (playing) clearHighlights();

  const now = spotify.position;
  const currIndex = currentIndex();
  const nextLyrics = lyrics.data.filter((obj) => obj.time > now);
  const currentLine = $(`.index-${currIndex}`);

  currentLine.classList.add("highlight");

  if (lyrics.type === "TEXT_SYNCED") {
    const words = [...currentLine.parentElement.children];
    const played = words.slice(0, words.indexOf(currentLine));
    const firstWord = lyrics.data[getElementIndex(words[0])];

    played.forEach((element) => element.classList.add("highlight"));

    if (firstWord.lineEnd > now)
      currentLine.parentElement.classList.add("active");
  }

  scrollToCenter(
    lyrics.type === "TEXT_SYNCED" ? currentLine.parentElement : currentLine,
    false
  );

  const currentInterlude = $(".highlight .dot")?.parentElement;

  if (currentInterlude)
    updateInterlude(currentInterlude, getElementIndex(currentInterlude));

  if (!playing) return;

  switch (lyrics.type) {
    case "TEXT_SYNCED":
    case "LINE_SYNCED": {
      currentLine.parentElement.classList.add("active");

      nextLyrics.forEach((lyric, index) => {
        index += currIndex + 1;

        const newElement = lyric.new || lyrics.type === "LINE_SYNCED";
        const currentLine = $(`.index-${index}`);

        if (lyric.lineEnd)
          timeouts.push(
            setTimeout(
              () => currentLine.parentElement.classList.remove("active"),
              lyric.lineEnd - now
            )
          );

        timeouts.push(
          setTimeout(() => {
            if (newElement) clearHighlights();

            currentLine.parentElement.classList.add("active");
            currentLine.classList.add("highlight");

            if (lyric.wait) updateInterlude(currentLine, index);
            if (newElement) scrollToCenter(currentLine);
          }, lyric.time - now)
        );
      });
      break;
    }
  }
};
const handleData = async (data) => {
  if (!data) return;

  clearTimeouts();
  clearHighlights();
  $All(".dot").forEach((element) => {
    element.classList.remove("active");
    element.removeAttribute("style");
    element.removeAttribute("ended");
  });

  if (data.local) return setLyricsStatus("Đang phát file cục bộ");
  if (!data.type || data.type !== "track") {
    document.documentElement.style = null;
    spotify = {};
    playing = false;

    document.title = "Lời bài hát";
    setProperty("--progress-bar-width", "0%");
    $(".title").textContent = "Tên bài hát";
    $(".artists").textContent = "Tên nghệ sĩ";

    if (data.type)
      switch (data.type) {
        case "episode":
          return setLyricsStatus("Đang phát podcast 🎙️");
        case "ad":
          return setLyricsStatus("Đang phát quảng cáo 📢");
        case "unknown":
          return setLyricsStatus("(._.) Không rõ bạn đang phát gì");
      }

    return setLyricsStatus("Một không gian tĩnh lặng 🤫");
  }

  document.title = data.playing ? "Đang phát" : "Đã tạm dừng";

  $(".progress-bar").style.width = `${
    ((data.position + +localStorage.getItem("count")) / data.duration) * 100
  }%`;

  $(".title").innerHTML = data.innerHTMLname;
  $(".artists").innerHTML = data.innerHTMLartists;

  if (data.name && spotify.id !== data.id) {
    document.documentElement.style = null;
    spotify = data;
    playing = data.playing;

    const translateBtn = $(".translate");

    changeColor(true);
    translateBtn.classList.add("disabled");
    setLyricsStatus("Đang tải...");

    lyrics = await axios
      .post(`/api/lyrics`, {
        name: data.name,
        id: data.id,
        album: data.album,
        artist: data.artists,
        duration: data.duration,
      })
      .then((response) => response.data)
      .catch(() => ({ message: "Không thể gửi yêu cầu" }));

    return writeLyrics();
  }
  spotify = data;
  playing = data.playing;

  update();
};
