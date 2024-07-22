import "./sentry.mjs";

import express from "express";
import * as Sentry from "@sentry/node";
import { rateLimit } from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import RedisManager from "./structures/Redis.mjs";
import MongoDBManager from "./structures/MongoDB.mjs";
import { sources } from "./structures/SourceManager.mjs";
import { NO_RESULT } from "./utils.mjs";

axios.defaults.timeout = 5000;
axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";

const { PORT } = process.env;
const redis = new RedisManager();
const mongodb = new MongoDBManager();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
  .use(express.static(path.join(__dirname, "public")));

app
  .get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "index.html"));
  })
  .get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "login.html"));
  })
  .get("/callback", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "callback.html"));
  });

app
  .use(express.json({ limit: "1kb" }))
  .use((error, req, res, next) => {
    if (error.type === "entity.too.large") return res.sendStatus(413);

    next();
  })
  .post("/api/lyrics", async (req, res) => {
    const { name, album, artists, id, duration } = req.body;

    if (
      !name ||
      !album ||
      !artists ||
      !id ||
      !duration ||
      typeof name !== "string" ||
      typeof album !== "string" ||
      typeof artists !== "string" ||
      typeof id !== "string" ||
      typeof duration !== "number" ||
      duration < 1
    )
      return res.sendStatus(400);

    try {
      let lyrics = await redis.get(id);

      if (!lyrics) {
        lyrics = await mongodb.getLyrics(req.body, sources);

        if (!lyrics) {
          const lineSynced = [];
          const notSynced = [];
          const other = [];

          for (const source of Object.values(sources)) {
            const data = await source.getLyrics(req.body);

            if (data) {
              if (data.type === "TEXT_SYNCED") {
                lyrics = data;

                break;
              }
              if (data.type === "LINE_SYNCED") lineSynced.push(data);
              else if (data.type === "NOT_SYNCED") notSynced.push(data);
              else other.push(data);
            }
          }

          if (!lyrics) lyrics = lineSynced[0] || notSynced[0] || other[0];
        }

        if (lyrics) redis.set(id, lyrics);
      }

      res.json(lyrics || NO_RESULT);
    } catch (error) {
      captureError(error);

      res.json({ message: "Đã xảy ra lỗi từ phía máy chủ 😔" });
    }
  })
  .all("*", (req, res) => res.sendStatus(404));

Sentry.setupExpressErrorHandler(app);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

process.on("unhandledRejection", captureError);
process.on("uncaughtException", captureError);

function captureError(error) {
  if (process.env.NODE_ENV !== "production") console.log(error);

  Sentry.captureException(error);
}
