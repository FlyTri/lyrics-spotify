let client_id = localStorage.getItem("client_id") || "";
let client_secret = localStorage.getItem("client_secret") || "";
let token = JSON.parse(localStorage.getItem("token"));

async function getToken(authCode = false) {
  const requestBody = new URLSearchParams();

  if (authCode) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    requestBody.append("grant_type", "authorization_code");
    requestBody.append("code", code);
    requestBody.append("redirect_uri", `${window.location.origin}/callback`);
  } else {
    requestBody.append("grant_type", "refresh_token");
    requestBody.append("refresh_token", token.refresh_token);
  }

  return axios
    .post(`https://accounts.spotify.com/api/token`, requestBody, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(client_id + ":" + client_secret),
      },
    })
    .then(async ({ data }) => {
      data.expires_at = Date.now() + data.expires_in * 1000;
      if (!authCode) data.refresh_token = requestBody.get("refresh_token");
      delete data.expires_in;

      localStorage.setItem("token", JSON.stringify(data));
      token = data;

      return true;
    })
    .catch((error) =>
      prompt(`Không thể lấy token. Lỗi:`, JSON.stringify(error.response.data))
    );
}
async function request(path) {
  return axios.get(`https://api.spotify.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
  });
}
async function getAccessToken() {
  if (Date.now() >= token.expires_at - 30000) await getToken();

  return token.access_token;
}
async function getCurrentlyPlaying() {
  return request("me/player/currently-playing")
    .then(async (response) => {
      const { data } = response;
      const error = data.error;

      if (error) {
        showMessage(
          `Lỗi: ${error.status} | ${error.message}. Hãy thử đăng nhập lại`,
          null,
          "error"
        );

        return { timestamp: -1, playing: false };
      }
      if ((data.timestamp || 1) === spotify.timestamp) return;
      if (response.status === 204) return { timestamp: 1, playing: false };

      const item = data.item;
      const date = Date.now();
      const defaultData = {
        playing: data.is_playing,
        timestamp: data.timestamp,
        type: data.currently_playing_type,
        local: data.item?.is_local || false,
      };

      if (defaultData.type === "track") {
        const artists = item.artists.map((artist) => artist.name).join(", ");
        const SpotifySession = await getSpotifySession();
        let valenceEmoji;

        if (item.id)
          valenceEmoji = await request(`audio-features/${item.id}`)
            .then(({ data }) => {
              const valence = data.valence;

              if (valence >= 0.9) {
                return "😆";
              } else if (valence >= 0.75) {
                return "😄";
              } else if (valence >= 0.6) {
                return "😊";
              } else if (valence >= 0.5) {
                return "🙂";
              } else if (valence >= 0.4) {
                return "😐";
              } else if (valence >= 0.3) {
                return "😕";
              } else if (valence >= 0.2) {
                return "😟";
              } else if (valence >= 0.1) {
                return "😢";
              } else {
                return "😭";
              }
            })
            .catch(() => null);

        return {
          ...defaultData,
          name: item.name,
          innerHTMLname: `<a href="https://open.spotify.com/track/${
            item.id
          }" target="_blank">${
            valenceEmoji ? `<span class="emoji">${valenceEmoji}</span>` : ""
          } ${item.name}</a>`,
          artists,
          innerHTMLartists: item.artists
            .map(
              ({ name, id }) =>
                `<a href="https://open.spotify.com/artist/${id}" target="_blank">${name}</a>`
            )
            .join(", "),
          image: SpotifySession?.thumbnail || item.album.images[0]?.url,
          album: item.album.name,
          id: item.id,
          get position() {
            const currentTime = Date.now();
            const count = +localStorage.getItem("count");

            if (SpotifySession) {
              const { position, last_updated_time } = SpotifySession.timeline;
              const elapsedTime = data.is_playing
                ? currentTime - last_updated_time * 1000
                : 0;
              return position + elapsedTime + count;
            }

            const progressTime = data.progress_ms;
            const elapsedTime = data.is_playing ? currentTime - date : 0;
            return progressTime + elapsedTime + count;
          },
          duration: item.duration_ms,
        };
      }

      return defaultData;
    })
    .catch((error) => {
      console.log(error);
      showMessage("Không thể cập nhật trình phát nhạc", null, "error");

      return {
        playing: false,
        timestamp: 0,
        type: "error",
      };
    });
}
