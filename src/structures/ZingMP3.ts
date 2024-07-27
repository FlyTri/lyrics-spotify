import axios from "axios";
import crypto from "node:crypto";
import { lrc as parseLRC } from "./Parser";
import { formatText, omitUndefined, trim } from "../utils";

import {
  ZingMP3LyricResponse,
  ZingMP3SearchResponse,
} from "../types/ZingMP3";

const { ZMP3_API_KEY, ZMP3_SECRET_KEY, ZMP3_VERSION } = process.env;

const instance = axios.create({
  baseURL: "https://zingmp3.vn/",
});

const createHash256 = (str: string) =>
  crypto.createHash("sha256").update(str).digest("hex");
const createHmac512 = (str: string) =>
  crypto.createHmac("sha512", ZMP3_SECRET_KEY!).update(str).digest("hex");

export default class ZingMP3 {
  cookie: string[];
  constructor() {
    this.cookie = [];
  }
  async #getCookie() {
    await instance("/")
      .then(({ headers }) => {
        this.cookie = headers["set-cookie"]!;
      })
      .catch(() => console.log("Failed to get ZingMP3 cookie"));

    setTimeout(() => this.#getCookie(), 86400000);
  }
  async #getId({ name, artists, duration }: SpotifyTrackData) {
    const date = Math.round(Date.now() / 1000);
    const path = "/api/v2/search";

    return instance
      .get(path, {
        params: {
          q: `${name} - ${artists}`,
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
        const data: ZingMP3SearchResponse = response.data;
        const songs = data.data.items.filter((item) => item.hasLyric);
        const song = songs.find(
          (song) => song.duration === Math.round(duration / 1000)
        );

        return song?.encodeId;
      })
      .catch(() => null);
  }
  async getLyrics(track: SpotifyTrackData, songId?: number) {
    if (!this.cookie.length) await this.#getCookie();

    const id = songId || (await this.#getId(track));
    const lyric: ZingMP3LyricResponse | null = await instance
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
      .then((response) => response.data)
      .catch(() => null);

    if (!lyric) return;

    const { sentences, file } = lyric.data;

    if (sentences)
      return {
        type: "TEXT_SYNCED",
        data: this.#parseTextSynced(sentences),
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
          data: parseLRC(lrc).lyrics,
          source: "Cung cấp bởi ZingMP3",
        };
    }
  }
  #parseTextSynced(sentences: ZingMP3LyricResponse["data"]["sentences"]) {
    const lyrics: (TextSynced | Interlude)[] = [];

    sentences.forEach((sentence) => {
      const lineEnd = sentence.words[sentence.words.length - 1].endTime;

      sentence.words.forEach(({ startTime, data }, i) => {
        if (!data) return;

        const space = sentence.words[i + 1] ? " " : "";
        const before = lyrics.findLast((obj) => obj.new);

        if (
          i === 0 &&
          before &&
          "lineEnd" in before &&
          startTime - before.lineEnd! >= 3000
        )
          lyrics.push({
            time: before.lineEnd!,
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
}
