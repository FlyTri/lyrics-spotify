import "dotenv/config";

import express from "express";
import { rateLimit } from "express-rate-limit";
import path from "path";
import axios from "axios";
import RedisManager from "./structures/Redis";
import MongoDBManager from "./structures/MongoDB";
import { sources } from "./structures/SourceManager";
import { getSpotifyTrack, NO_RESULT } from "./utils";

import { Lyrics } from "./types";

axios.defaults.timeout = 5000;
axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const { PORT, PRIVATE_KEY } = process.env;
const redis = new RedisManager();
const mongodb = new MongoDBManager();
const app = express();

app.use(
  rateLimit({
    windowMs: 1000,
    limit: 100,
    message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau." },
  })
);

app
  .use((req, res, next) => {
    if (
      req.url.startsWith("/fonts") ||
      req.url.startsWith("/icons") ||
      req.url.startsWith("/data")
    )
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");

    next();
  })
  .use(express.static(path.join(__dirname, "..", "public")));

app
  .get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "pages", "index.html"));
  })
  .get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "pages", "login.html"));
  })
  .get("/callback", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "pages", "callback.html"));
  });

app
  .get("/api/lyrics/:id([A-Za-z0-9]{22})", async (req, res) => {
    const { id } = req.params;
    const accessToken = req.headers.authorization;

    if (!accessToken) return res.sendStatus(401);

    const track = await getSpotifyTrack(id, accessToken);

    if (!track) return res.json({ message: "Không tìm thấy bài hát" });

    try {
      const lyrics = await getBestLyrics(track);

      res.json(lyrics || NO_RESULT);
    } catch (error) {
      console.log(error);

      res.json({
        message: '<span class="emoji">😔</span>Đã xảy ra lỗi từ phía máy chủ',
      });
    }
  })
  .get("/api/lyrics/:source/:id", async (req, res) => {
    if (req.headers.authorization !== PRIVATE_KEY) return res.sendStatus(401);

    const { source, id } = req.params;

    if (!(source in sources) || !id) return res.sendStatus(400);

    // @ts-expect-error ID is provided
    const result = await sources[source as Sources].getLyrics(null, +id || id);

    res.json(result || NO_RESULT);
  })
  .get("/api/download/:id([A-Za-z0-9]{22})", async (req, res) => {
    const { id } = req.params;

    const data = await axios(`https://api.spotifydown.com/download/${id}`, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
        dnt: "1",
        "if-none-match": 'W/"1d9-+qLva7rXNcFG0l6Y81ubQG6qJ7g"',
        origin: "https://spotifydown.com",
        priority: "u=1, i",
        referer: "https://spotifydown.com/",
        "sec-ch-ua":
          '"Not)A;Brand";v="99", "Brave";v="127", "Chromium";v="127"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    })
      .then((response) => response.data as SpotifyDownResponse)
      .catch((error) =>
        error.response ? (error.response.data as SpotifyDownResponse) : null
      );

    if (!data)
      return res.json({ message: "Không thể gửi kêu cầu đến 3rd API" });
    if (!data.success)
      return res.json({ message: `Lỗi từ 3rd API: ${data.message}` });

    res.json({ link: data.link });
  })
  .all("*", (req, res) => res.status(404).send(""));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

async function getLyricsFromSources(
  data: SpotifyTrackData
): Promise<Lyrics | undefined> {
  const lineSynced = [];
  const notSynced = [];
  const other = [];

  for (const source of Object.values(sources)) {
    const result = await source.getLyrics(data);

    if (result && "type" in result)
      switch (result.type) {
        case "TEXT_SYNCED":
          return result;
        case "LINE_SYNCED":
          lineSynced.push(result);
          break;
        case "NOT_SYNCED":
          notSynced.push(result);
          break;
        default:
          other.push(result);
      }
  }

  return lineSynced[0] || notSynced[0] || other[0];
}

async function getBestLyrics(track: SpotifyTrackData) {
  let lyrics = await redis.get(track.id);

  if (!lyrics) {
    lyrics = await mongodb.getLyrics(track, sources);

    if (!lyrics) lyrics = await getLyricsFromSources(track);

    redis.set(track.id, lyrics || NO_RESULT);
  }

  return lyrics || NO_RESULT;
}
