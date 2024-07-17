import axios from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";
import crypto from "crypto";
import { formatText, formatTime, omitUndefined, trim } from "../utils.mjs";

const { PROXY, ZMP3_API_KEY, ZMP3_SECRET_KEY, ZMP3_VERSION } =
  process.env;

const proxyAgent = PROXY ? new SocksProxyAgent(process.env.PROXY) : null;
const instance = axios.create({
  baseURL: "https://zingmp3.vn/",
  httpAgent: proxyAgent,
});

const createHash256 = (str) =>
  crypto.createHash("sha256").update(str).digest("hex");
const createHmac512 = (str) =>
  crypto.createHmac("sha512", ZMP3_SECRET_KEY).update(str).digest("hex");

export default class ZingMP3 {
  constructor() {
    this.cookie = [];
  }
  async #getCookie() {
    await instance
      .get("/")
      .then(({ headers }) => {
        this.cookie = headers["set-cookie"];
      })
      .catch(() => console.log("Failed to get ZingMP3 cookie"));
  }
  async #getId({ name, artist, duration }) {
    const date = Math.round(Date.now() / 1000);
    const path = "/api/v2/search";

    return instance
      .get(path, {
        params: {
          q: `${name} - ${artist}`,
          type: "song",
          page: 1,
          count: 5,
          sig: createHmac512(
            path +
              createHash256(
                `count=5ctime=${date}page=1type=songversion=${ZMP3_VERSION}`
              )
          ),
          ctime: date,
          version: ZMP3_VERSION,
          apiKey: ZMP3_API_KEY,
        },
        headers: { cookie: this.cookie },
      })
      .then((response) => {
        const songs = response.data.data.items.filter((item) => item.hasLyric);
        const song = songs.find(
          (song) => song.duration === Math.round(duration / 1000)
        );

        return song?.encodeId;
      })
      .catch(() => null);
  }
  async getLyrics(metadata, songId) {
    if (!this.cookie.length) await this.#getCookie();

    const id = songId || (await this.#getId(metadata));
    const lyric = await instance
      .get("/api/v2/lyric/get/lyric", {
        params: {
          id,
          sig: createHmac512(
            "/api/v2/lyric/get/lyric" +
              createHash256(`id=${id}version=${ZMP3_VERSION}`)
          ),
          version: ZMP3_VERSION,
          apiKey: ZMP3_API_KEY,
        },
        headers: { cookie: this.cookie },
      })
      .then((response) => response.data.data)
      .catch(() => null);

    if (!lyric) return;

    const { sentences, file } = lyric;

    if (sentences)
      return {
        type: "TEXT_SYNCED",
        data: this.#parseTextSynced(sentences),
        translated: [],
        source: "Cung cấp bởi ZingMP3",
      };

    if (file) {
      const lrc = await axios
        .get(file)
        .then((response) => trim(response.data))
        .catch(() => null);

      if (lrc)
        return {
          type: "LINE_SYNCED",
          data: this.#parseLineSynced(lrc),
          translated: [],
          source: "Cung cấp bởi ZingMP3",
        };
    }
  }
  #parseTextSynced(sentences) {
    const lyrics = [];

    sentences.forEach((sentence) => {
      const lineEnd = sentence.words[sentence.words.length - 1].endTime;

      sentence.words.forEach(({ startTime, data }, i) => {
        const space = sentence.words[i + 1] ? " " : "";
        const before = lyrics.findLast((obj) => obj.new);

        if (i === 0 && before && startTime - before.lineEnd >= 3000)
          lyrics.push({
            time: before.lineEnd,
            wait: true,
            new: true,
          });

        lyrics.push(
          omitUndefined({
            text: formatText(data) + space,
            time: +startTime,
            new: i === 0 || undefined,
            lineEnd: i === 0 ? lineEnd : undefined,
          })
        );
      });
    });

    if (lyrics[0].time) lyrics.unshift({ time: 0, wait: true });

    return lyrics;
  }
  #parseLineSynced(lrc) {
    const splitted = lrc.split(/\r?\n/);
    const data = [];

    splitted.forEach((line) => {
      const match = /^\[(\d+:\d+\.\d+)\](.*)$/.exec(line);

      if (!match) return;

      const [, time, content] = match;

      data.push({
        text: formatText(content),
        time: formatTime(time.slice(1, -1)),
      });
    });

    return data;
  }
}
