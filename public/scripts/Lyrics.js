let timeouts = [];
let lyrics = {};
let spotify = {};
let playing = false;

const clearTimeouts = () => {
  timeouts.forEach(clearTimeout);
  timeouts = [];
};
const clearHighlights = () => {
  $All(".highlight").forEach((element) => {
    element.classList.remove("highlight");
  });
};
const currentIndex = () => {
  const progress = spotify.position / 1000;

  return lyrics.data.findLastIndex((obj) => obj.time <= progress);
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
  if (obj.wait) {
    element.innerHTML = '<span class="dot"></span>'.repeat(3);
  } else {
    element.textContent = obj.text || "♫";
  }
};
const writeTranslates = () => {
  const lines = $All(".translated");

  if (lines.length) {
    lines.forEach((element) => element.remove());
    localStorage.setItem("translate", false);
  } else {
    $All(".lyrics").forEach((element) => {
      const translated = lyrics.translated.find(
        (item) => item.original === element.textContent
      );

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
  const lyricsToWrite = [...lyrics.data];

  switch (lyrics.type) {
    case "TEXT_SYNCED": {
      let p = document.createElement("p");
      p.classList.add("lyrics");

      lyricsToWrite.forEach((obj, index) => {
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
      lyricsToWrite.forEach((obj, index) => {
        const element = document.createElement("p");
        element.classList.add("lyrics", `index-${index}`);
        writeContent(obj, element);
        appendChild(".content", element);
      });
      break;
    }
    case "NOT_SYNCED": {
      lyricsToWrite.forEach((obj) => {
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

  if (!spotify.id) {
    $(".content").innerHTML = "";
    
    return;
  }
  if (!lyrics.data || lyrics.type === "NOT_SYNCED") return;
  if (playing) clearHighlights();

  const now = spotify.position / 1000;
  const currIndex = currentIndex();
  const nextLyrics = lyrics.data.filter((obj) => obj.time > now);
  const currentLine = $(`.index-${currIndex}`);

  currentLine.classList.add("highlight");

  if (lyrics.type === "TEXT_SYNCED") {
    const words = [...currentLine.parentElement.children];
    const played = words.slice(0, words.indexOf(currentLine));
    const firstWord = lyrics.data[getElementIndex(words[0])];

    played.forEach((element) => element.classList.add("highlight"));

    if (firstWord.end > now) currentLine.parentElement.classList.add("active");
  }

  scrollToCenter(
    lyrics.type === "TEXT_SYNCED" ? currentLine.parentElement : currentLine,
    false
  );

  if (!playing) return;

  if (!currIndex && lyrics.data[0].wait) {
    const delay = (lyrics.data[1].time - spotify.position / 1000) / 3;
    const elements = [...$All("span.dot")];

    setProperty("--dot-delay", `${delay}s`);

    [0, 1, 2].forEach((index) =>
      timeouts.push(
        setTimeout(
          () => elements.pop().classList.add("active"),
          delay * index * 1000
        )
      )
    );
  }

  switch (lyrics.type) {
    case "TEXT_SYNCED":
    case "LINE_SYNCED": {
      currentLine.parentElement.classList.add("active");

      nextLyrics.forEach((lyric, index) => {
        index += currIndex + 1;

        const newElement = lyric.new || lyrics.type === "LINE_SYNCED";

        if (lyric.end)
          timeouts.push(
            setTimeout(
              () =>
                Array.from($All(".highlight")).forEach((element) =>
                  element.parentElement.classList.remove("active")
                ),
              (lyric.end - now) * 1000
            )
          );

        timeouts.push(
          setTimeout(() => {
            if (newElement) clearHighlights();

            const currentLine = $(`.index-${index}`);

            $All("p").forEach((i) => i.classList.remove("active"));
            currentLine.parentElement.classList.add("active");
            currentLine.classList.add("highlight");

            if (newElement) scrollToCenter(currentLine);
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
    ((data.position + +localStorage.getItem("count")) / data.duration) * 100
  }%`;

  $(".title").innerHTML = data.innerHTMLname;
  $(".artists").innerHTML = data.innerHTMLartists;

  if (data.name && spotify.id !== data.id) {
    document.documentElement.style = null;
    spotify = data;
    playing = data.playing;

    const translateBtn = $(".translate");

    changeColor();
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
    spotify.id &&
    lyrics.type !== "NOT_SYNCED" &&
    lyrics.data?.[0].wait &&
    !currentIndex()
  )
    writeLyrics();

  update();
};
