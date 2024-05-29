let timeouts = [];
let lyrics;
let spotify = {};
let playing = false;

setInterval(() => {
  const width = document.querySelector(".progress-bar").style.width;

  if (playing) {
    document.querySelector(".progress-bar").style.width = `${
      ((DateNow() - spotify.timestamps.start) /
        (spotify.timestamps.end -
          DateNow() +
          (DateNow() - spotify.timestamps.start))) *
      100
    }%`;
  } else if (width != "0%")
    document.querySelector(".progress-bar").style.width = "0%";
});
const setLyricsStatus = (text) => {
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  const element = document.createElement("p");
  element.classList.add("lyrics", "highlight");
  element.textContent = text;
  document.querySelector(".content").appendChild(element);
};
const currentIndex = () => {
  const now = (DateNow() - spotify.timestamps.start) / 1000;
  const before = lyrics.data.flat(Infinity).filter((obj) => obj.time <= now);

  return before[before.length - 1].index;
};
const writeLyrics = () => {
  document.querySelectorAll(".lyrics").forEach((i) => i.remove());

  if (typeof lyrics === "string") setLyricsStatus(lyrics);
  else {
    switch (lyrics.type) {
      case "TEXT_SYNCED": {
        lyrics.data.map((obj) => {
          const element = document.createElement("p");

          element.classList.add("lyrics");
          obj.map(({ text, time, index }) => {
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
        lyrics.data.map((obj) => {
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
        lyrics.data.map((obj) => {
          const element = document.createElement("p");
          element.classList.add("lyrics", "highlight");
          element.textContent = obj.text;

          document.querySelector(".content").appendChild(element);
        });
        break;
      }
    }
  }
};
const update = () => {
  timeouts.forEach((t) => clearTimeout(t));
  timeouts = [];

  if (!playing)
    return document.querySelectorAll(".lyrics").forEach((i) => i.remove());
  if (!lyrics.data || lyrics.type === "NOT_SYNCED") return;

  const now = (DateNow() - spotify.timestamps.start) / 1000;
  const nextLyrics = lyrics.data
    .flat(Infinity)
    .filter((obj) => obj.time >= now);

  const currentLine = document.querySelector(`.index-${currentIndex()}`);

  if (currentIndex() === -1) {
    const wait =
      (lyrics.data.flat(Infinity)[1].time * 1000 -
        (DateNow() - spotify.timestamps.start)) /
      4;
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
  document.querySelectorAll("p").forEach((i) => i.classList.remove("bold"));
  currentLine.classList.add("highlight");
  if (lyrics.type === "TEXT_SYNCED")
    currentLine.parentElement.classList.add("bold");
  currentLine.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  if (playing) {
    switch (lyrics.type) {
      case "TEXT_SYNCED": {
        nextLyrics
          .filter((lyric) => lyric.text != " ")
          .map((lyric) => {
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
        break;
      }
      case "LINE_SYNCED": {
        nextLyrics.map((lyric) => {
          timeouts.push(
            setTimeout(() => {
              if (!playing) return;

              document
                .querySelectorAll("p")
                .forEach((i) => i.classList.remove("highlight"));
              const currentLine = document.querySelector(
                `.index-${lyric.index}`
              );
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
        break;
      }
    }
  }
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
    const params = new URLSearchParams({
      name: d.spotify.song,
      id: d.spotify.track_id,
      album: d.spotify.album,
      artist: d.spotify.artist,
      duration: d.spotify.timestamps.end - d.spotify.timestamps.start,
    }).toString();

    timeouts.forEach((t) => clearTimeout(t));
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

    spotify = d.spotify;
    playing = d.listening_to_spotify;

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
