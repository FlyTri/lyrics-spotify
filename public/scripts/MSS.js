const instance = axios.create({ baseURL: "http://localhost:8170/" });

function checkMSS() {
  return instance
    .get("/")
    .then(() => true)
    .catch(() => false);
}

function getSpotifySession() {
  return instance
    .get("/spotify")
    .then((response) => response.data)
    .catch(() => null);
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();

    instance.get("/toggle");
  }
  if (event.code === "ArrowLeft") {
    event.preventDefault();

    instance.get("/rewind");
  }
  if (event.code === "ArrowRight") {
    event.preventDefault();

    instance.get("/fast_forward");
  }
});

document.querySelector(".content").addEventListener("click", async (event) => {
  const index = getElementIndex(event.target);

  if (index) instance.get(`/seek?time=${lyrics.data[index].time}`);
});
