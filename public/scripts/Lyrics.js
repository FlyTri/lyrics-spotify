let controller;
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
  $All(".animate").forEach((element) => element.classList.remove("animate"));
};
const currentIndex = () =>
  lyrics.data.findLastIndex((obj) => obj.time <= spotify.position);
const setLyricsStatus = (html) => {
  clearTimeouts();
  $(".content").innerHTML = "";

  const element = document.createElement("p");

  element.classList.add("lyrics", "status");
  element.innerHTML = DOMPurify.sanitize(html);
  $(".content").append(element);
};
const writeContent = (obj, element) => {
  if (obj.wait || (!obj.text && typeof obj.time === "number")) {
    const wait = lyrics.data[lyrics.data.indexOf(obj) + 1].time - obj.time;
    const delay = wait / 3;
    const offset = spotify.position - obj.time;
    const time = [delay, delay * 2, delay * 3];
    const position = time.findIndex((n) => offset <= n);
    const animationDelay = offset - delay * position;

    $(".content").style.setProperty("--dot-delay", `${delay}ms`);

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
    if (obj.text[obj.text.length - 1] === " ") {
      obj.text = obj.text.slice(0, -1);
    } else element.classList.add("no-space");
    if (obj.duration)
      element.style.setProperty("--duration", `${obj.duration}ms`);

    element.textContent = obj.text || "♫";
  }
};
const writeLyrics = async () => {
  $(".content").innerHTML = "";

  if (lyrics.message) return setLyricsStatus(lyrics.message);

  switch (lyrics.type) {
    case "INSTRUMENTAL":
      return setLyricsStatus("Hãy tận hưởng những giai điệu tuyệt vời~");
    case "DJ":
      return setLyricsStatus("Quẩy lên nào!");
    case "NO_RESULT":
      return setLyricsStatus("Có lẽ bạn phải đoán lời bài hát...");
  }

  const fm = document.createDocumentFragment();

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      let p = document.createElement("p");
      p.classList.add("lyrics");

      lyrics.data.forEach((obj, index) => {
        if (obj.new) {
          fm.append(p);
          p = document.createElement("p");
          p.classList.add("lyrics");
        }

        const span = document.createElement("span");

        span.classList.add(`index-${index}`);
        writeContent(obj, span);
        p.append(span);

        if (!lyrics.data[index + 1]) fm.append(p);
      });
      break;
    }
    case "LINE_SYNCED":
      lyrics.data.forEach((obj, index) => {
        const element = document.createElement("p");

        element.classList.add("lyrics", `index-${index}`);
        writeContent(obj, element);
        fm.append(element);
      });
      break;
    case "NOT_SYNCED":
      lyrics.data.forEach((obj) => {
        const element = document.createElement("p");

        element.classList.add("lyrics", "highlight");
        writeContent(obj, element);
        fm.append(element);
      });
      break;
  }

  const sourceElement = document.createElement("p");

  sourceElement.classList.add("source");
  sourceElement.textContent = lyrics.source;
  fm.append(sourceElement);

  $(".content").append(fm);

  if (localStorage.getItem("convert") === "1" && needConvert()) convert();

  return true;
};
const updateInterlude = (currentLine, index) => {
  writeContent(lyrics.data[index], currentLine);
};
const update = () => {
  clearTimeouts();

  if (!spotify.id) {
    $(".content").innerHTML = "";

    return;
  }
  if (lyrics.type !== "TEXT_SYNCED" && lyrics.type !== "LINE_SYNCED") return;
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

    // if (firstWord.lineEnd > now)
    //   currentLine.parentElement.classList.add("active");
  }

  scrollToCenter(
    lyrics.type === "TEXT_SYNCED" ? currentLine.parentElement : currentLine,
    false
  );

  const currentInterlude = $(".highlight .dot")?.parentElement;

  if (currentInterlude)
    updateInterlude(currentInterlude, getElementIndex(currentInterlude));

  if (!playing) return;

 // currentLine.parentElement.classList.add("active");

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

        //  currentLine.parentElement.classList.add("active");
        //   currentLine.classList.add("highlight");
        if (lyric.duration) currentLine.classList.add("animate");
        if (lyric.wait || (!lyric.text && typeof lyric.time === "number"))
          updateInterlude(currentLine, index);
        if (newElement) scrollToCenter(currentLine);
      }, lyric.time - now)
    );
  });
};
const fetchLyrics = async (id) => {
  if (controller) controller.abort();

  $(".convert").classList.add("disabled");
  setLyricsStatus("Đang tải...");

  controller = new AbortController();
  lyrics = await axios(`/api/lyrics/${id}`, {
    headers: { Authorization: await getAccessToken() },
    signal: controller.signal,
  })
    .then((response) => response.data)
    .catch(async (error) => {
      if (error.message === "canceled") return;

      return { message: "Không thể gửi yêu cầu" };
    });

  if (!lyrics) return;

  await writeLyrics();

  if (lyrics.data && needConvert()) $(".convert").classList.remove("disabled");
};

const handleData = async (data) => {
  clearTimeouts();
  clearHighlights();
  $All(".active").forEach((element) => element.classList.remove("active"));
  $All(".dot").forEach((element) => {
    element.removeAttribute("style");
    element.removeAttribute("ended");
  });

  $("body").style.backgroundImage = data.image ? `url(${data.image})` : null;

  if (data.id) $(".download").classList.remove("disabled");
  else $(".download").classList.add("disabled");

  if (data.local) {
    setLyricsStatus(`${emoji("📂")}Đang phát file cục bộ`);
  } else if (!data.id || data.type !== "track") {
    lyrics = {};
    document.title = "Lời bài hát";
    $(".title").textContent = "Tên bài hát";
    $(".artists").textContent = "Tên nghệ sĩ";

    const statusMessages = {
      episode: `${emoji("🎙️")}Đang phát podcast`,
      ad: `${emoji("📢")}Đang phát quảng cáo`,
      unknown: `${emoji("🤔")}Không rõ bạn đang phát gì`,
      default: `${emoji("🤫")}Một không gian tĩnh lặng`,
    };

    setLyricsStatus(statusMessages[data.type] || statusMessages.default);
  } else {
    document.title = data.playing ? "Đang phát" : "Đã tạm dừng";
    $(".title").innerHTML = data.innerHTMLname;
    $(".artists").innerHTML = data.innerHTMLartists;

    if (spotify.id !== data.id) {
      spotify = data;
      playing = data.playing;

      await fetchLyrics(data.id);
    }
  }

  spotify = data;
  playing = data.playing;

  if (data.id) update();
};
