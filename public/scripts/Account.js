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

  return fetch(`https://accounts.spotify.com/api/token`, {
    method: "POST",
    body: requestBody,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(client_id + ":" + client_secret),
    },
  }).then(async (response) =>
    response.json().then((data) => {
      if (response.ok) {
        data.expires_at = Date.now() + data.expires_in * 1000;
        if (!authCode) data.refresh_token = requestBody.get("refresh_token");
        delete data.expires_in;

        localStorage.setItem("token", JSON.stringify(data));
        token = data;

        return true;
      } else alert(`Không thể lấy token. Lỗi: ${JSON.stringify(data)}`);
    })
  );
};
const getCurrentlyPlaying = async () => {
  if (Date.now() >= token.expires_at) await getToken();

  return fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  })
    .then(async (response) => {
      if (response.status === 204) return { playing: false };

      const data = await response.json();
      const item = data.item;
      const date = Date.now();
      const defaultData = {
        playing: data.is_playing,
        timestamp: data.timestamp,
        type: data.currently_playing_type,
      };

      if (data.currently_playing_type === "track")
        return {
          ...defaultData,
          name: item.name,
          innerHTMLname: `<a href="https://open.spotify.com/track/${item.id}" target="_blank">${item.name}</a>`,
          artists: item.artists.map((artist) => artist.name).join(", "),
          innerHTMLartists: item.artists
            .map(
              ({ name, id }) =>
                `<a href="https://open.spotify.com/artist/${id}" target="_blank">${name}</a>`
            )
            .join(", "),
          image: item.album.images[0].url,
          album: item.album.name,
          id: item.id,
          progress: () =>
            data.progress_ms +
            (data.is_playing ? Date.now() - date : 0) +
            Number(localStorage.getItem("count")),
          duration: item.duration_ms,
        };

      return defaultData;
    })
    .catch(() => ({
      playing: false,
      timestamp: Date.now(),
      type: "error",
    }));
};
