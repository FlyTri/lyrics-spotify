import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import RedisManager from "./structures/Redis.mjs";
import MongoDBManager from "./structures/MongoDB.mjs";
import MusixmatchManager from "./structures/Musixmatch.mjs";
import QQMusicManager from "./structures/QQMusic.mjs";
import { NO_RESULT } from "./utils.mjs";

axios.defaults.timeout = 15000;
axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";

const { PORT } = process.env;
const redis = new RedisManager();
const mongodb = new MongoDBManager();
const musixmatch = new MusixmatchManager();
const qq = new QQMusicManager();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app
  .use(express.static(path.join(__dirname, "public")))
  .use(express.json())
  .get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "index.html"));
  })
  .get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "login.html"));
  })
  .get("/callback", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "callback.html"));
  })
  .post("/api/lyrics", async (req, res) => {
    const { name, album, artist, id, duration } = req.body;

    if (!name || !album || !artist || !id || !duration)
      return res.sendStatus(400);
    if (
      typeof name !== "string" ||
      name.length < 1 ||
      name.length > 500 ||
      typeof album !== "string" ||
      album.length < 1 ||
      album.length > 500 ||
      typeof artist !== "string" ||
      artist.length < 1 ||
      artist.length > 500 ||
      typeof id !== "string" ||
      id.length !== 22 ||
      typeof duration !== "number" ||
      duration < 1 ||
      duration > 18000000
    )
      return res.sendStatus(400);

    let cached = await redis.get(id);
    let lyrics;

    if (!cached) {
      if (!lyrics)
        lyrics = await mongodb.getLyrics(req.body, { musixmatch, qq });

      if (!lyrics)
        lyrics =
          (await qq.getLyrics(req.body)) ||
          (await musixmatch.getLyrics(req.body));

      if (lyrics) redis.set(id, lyrics);
    }

    res
      .setHeader("Content-Type", "application/json")
      .send(cached || lyrics || NO_RESULT);
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}`));

process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);
