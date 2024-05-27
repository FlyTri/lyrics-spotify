let storedID = localStorage.getItem("id");
let spotify = {};
let playing = false;

if (!storedID) {
  const id = prompt("Nhập ID Discord của bạn") || "";
  if (!id || !/^\d{17,19}$/.test(id)) window.location.reload();

  localStorage.setItem("id", id);
  storedID = id;
}

const ws = new WebSocket("wss://api.lanyard.rest/socket");
ws.onopen = (event) => {
  console.log(`Connected! Took ${event.timeStamp}ms`);
  ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: storedID } }));
};
ws.onmessage = async ({ data }) => {
  const { op, d } = JSON.parse(data);

  switch (op) {
    case 1: {
      console.log(`|| HELLO || Heartbeat interval: ${d.heartbeat_interval}ms`);

      setInterval(() => {
        console.log("Sending heartbeat interval...");

        ws.send(JSON.stringify({ op: 3 }));
      }, d.heartbeat_interval);
      break;
    }
    case 0: {
      if (d.discord_status === "offline" || !d.spotify) {
        spotify = {};
        playing = false;

        document.querySelector(".title").textContent = "Hiện không phát";
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
        ? d.spotify.artist.replace(";", ",")
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

        writeLyrics();
      }

      spotify = d.spotify;
      playing = d.listening_to_spotify;
      if (currentIndex() === -1) writeLyrics();
      update();
    }
  }
};
