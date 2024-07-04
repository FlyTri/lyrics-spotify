let client_id = localStorage.getItem("client_id") || "";
let client_secret = localStorage.getItem("client_secret") || "";
let token = JSON.parse(localStorage.getItem("token"));

const getToken = async (authCode = false) => {
  const requestBody = new URLSearchParams();

  if (authCode) {
    const params = new URLSearchParams(window.location.href);
    const code = params.get(`${window.location.origin}/callback?code`);

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
      data.expires_at = _.now() + data.expires_in * 1000;
      if (!authCode) data.refresh_token = requestBody.get("refresh_token");
      delete data.expires_in;

      localStorage.setItem("token", JSON.stringify(data));
      token = data;

      return true;
    })
    .catch((error) =>
      prompt(`Không thể lấy token. Lỗi:`, JSON.stringify(error.response.data))
    );
};
const getCurrentlyPlaying = async () => {
  if (_.now() >= token.expires_at) await getToken();

  return axios
    .get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    })
    .then(async (response) => {
      if (response.status === 204) return { playing: false };

      const { data } = response;
      const error = data.error;

      if (error) {
        showMessage(
          `Lỗi: ${error.status} | ${error.message}. Hãy thử đăng nhập lại`
        );

        return { playing: false };
      }

      const mediaSession = await axios("http://127.0.0.1:8170/sessions")
        .then((response) => response.data)
        .catch(() => null);

      const SpotifySession = mediaSession
        ? _.find(
            mediaSession.sessions,
            (session) =>
              session.source === "Spotify.exe" &&
              session.title === data.item.name
          )
        : null;

      const item = data.item;
      const date = _.now();
      const defaultData = {
        playing: data.is_playing,
        timestamp: data.timestamp,
        type: data.currently_playing_type,
      };

      if (data.currently_playing_type === "track") {
        const artists = _.join(
          _.map(item.artists, (artist) => artist.name),
          ", "
        );

        return {
          ...defaultData,
          name: item.name,
          innerHTMLname: `<a href="https://open.spotify.com/track/${item.id}" target="_blank">${item.name}</a>`,
          artists,
          innerHTMLartists: _.chain(item.artists)
            .map(
              ({ name, id }) =>
                `<a href="https://open.spotify.com/artist/${id}" target="_blank">${name}</a>`
            )
            .join(", "),
          image: SpotifySession
            ? SpotifySession.thumbnail
            : item.album.images[0].url,
          album: item.album.name,
          id: item.id,
          get position() {
            if (SpotifySession)
              return (
                SpotifySession.timeline.position +
                (data.is_playing
                  ? Date.now() -
                    SpotifySession.timeline.last_updated_time * 1000
                  : 0) +
                _.toNumber(localStorage.getItem("count"))
              );

            return (
              data.progress_ms +
              (data.is_playing ? _.now() - date : 0) +
              _.toNumber(localStorage.getItem("count"))
            );
          },
          duration: item.duration_ms,
        };
      }
      return defaultData;
    })
    .catch(() => {
      showMessage("Không thể cập nhật trình phát nhạc");

      return {
        playing: false,
        timestamp: _.now(),
        type: "error",
      };
    });
};
const seekTo = (position) => {};
