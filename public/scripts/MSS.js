const instance = axios.create({
  baseURL: "http://localhost:8170/",
  timeout: 500,
});

let mss = null;

async function checkMSS() {
  mss = await instance
    .get("/")
    .then(() => true)
    .catch(() => false);

  return mss;
}

function getSpotifySession() {
  if (!mss) return;

  return instance
    .get("/spotify")
    .then((response) => response.data)
    .catch(() => null);
}

document.addEventListener("keydown", (event) => {
  if (!mss) return;

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
  if (!mss) return;

  const index = getElementIndex(event.target);

  if (index) instance.get(`/seek?time=${lyrics.data[index].time}`);
});
