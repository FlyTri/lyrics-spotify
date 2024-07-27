import "dotenv/config";

import express from "express";
import { rateLimit } from "express-rate-limit";
import path from "path";
import axios from "axios";
import RedisManager from "./structures/Redis";
import MongoDBManager from "./structures/MongoDB";
import { sources } from "./structures/SourceManager";
import { NO_RESULT } from "./utils";

axios.defaults.timeout = 5000;
axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const { PORT } = process.env;
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

    const track = await axios
      .get(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) => {
        const track: SpotifyApi.SingleTrackResponse = response.data;

        return {
          id,
          name: track.name,
          duration: track.duration_ms,
          album: track.album.name,
          artists: track.artists.map((artist) => artist.name).join(", "),
        } as SpotifyTrackData;
      })
      .catch(() => null);

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
  .all("*", (req, res) => res.status(404).send(""));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

async function getLyricsFromSources(data: SpotifyTrackData) {
  const lineSynced = [];
  const notSynced = [];
  const other = [];

  for (const source of Object.values(sources)) {
    const result = await source.getLyrics(data);

    if (result) {
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
  }

  return lineSynced[0] || notSynced[0] || other[0];
}

async function getBestLyrics(track: SpotifyTrackData) {
  let lyrics = await redis.get(track.id);

  if (!lyrics) {
    lyrics = await mongodb.getLyrics(track, sources);

    if (!lyrics) lyrics = await getLyricsFromSources(track);
    if (lyrics) redis.set(track.id, lyrics);
  }

  return lyrics || NO_RESULT;
}
