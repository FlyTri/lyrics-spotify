import "dotenv/config";
import "./sentry.mjs";

import * as Sentry from "@sentry/node";
import express from "express";
import { rateLimit } from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import RedisManager from "./structures/Redis.mjs";
import MongoDBManager from "./structures/MongoDB.mjs";
import SourceManager from "./structures/SourceManager.mjs";
import { NO_RESULT } from "./utils.mjs";

axios.defaults.timeout = 5000;
axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";

const { PORT } = process.env;
const redis = new RedisManager();
const mongodb = new MongoDBManager();
const { sources } = new SourceManager();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

Sentry.setupExpressErrorHandler(app);
app
  .use(
    rateLimit({
      windowMs: 1000,
      limit: 100,
      message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau." },
    })
  )
  .use(express.static(path.join(__dirname, "public")))
  .get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "index.html"));
  })
  .get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "login.html"));
  })
  .get("/callback", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "callback.html"));
  })
  .use(express.json())
  .post("/api/lyrics", async (req, res) => {
    const { name, album, artists, id, duration } = req.body;

    if (!name || !album || !artists || !id || !duration)
      return res.sendStatus(400);
    if (
      typeof name !== "string" ||
      name.length < 1 ||
      name.length > 500 ||
      typeof album !== "string" ||
      album.length < 1 ||
      album.length > 500 ||
      typeof artists !== "string" ||
      artists.length < 1 ||
      artists.length > 500 ||
      typeof id !== "string" ||
      id.length !== 22 ||
      typeof duration !== "number" ||
      duration < 1 ||
      duration > 18000000
    )
      return res.sendStatus(400);

    res.setHeader("Content-Type", "application/json");

    try {
      let cached = await redis.get(id);
      let lyrics;

      if (!cached) {
        if (!lyrics) lyrics = await mongodb.getLyrics(req.body, sources);

        if (!lyrics)
          for (const source of Object.values(sources)) {
            lyrics = await source.getLyrics(req.body);

            if (lyrics) break;
          }

        if (lyrics) redis.set(id, lyrics);
      }

      res.send(cached || lyrics || NO_RESULT);
    } catch (error) {
      console.log(error);

      res.send({ message: "Đã xảy ra lỗi từ phía máy chủ 😔" });
    }
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}`));

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
// process.on("unhandledRejection", console.log);
// process.on("uncaughtException", console.log);
