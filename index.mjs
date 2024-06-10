import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import MusixmatchManager from "./structures/Musixmatch.mjs";

axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36";

const { PORT } = process.env;
const Musixmatch = new MusixmatchManager();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app
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
  .get("/api/lyrics", async (req, res) => {
    const { name, album, artist, id, duration } = req.query;
    if (!name || !album || !artist || !id || !duration)
      return res.sendStatus(400);

    const data = await Musixmatch.getLyrics(name, album, artist, id, duration);

    res.setHeader("Content-Type", "application/json").send(data);
  })
  .listen(PORT, () => console.log(`Listening on port ${PORT}`));
