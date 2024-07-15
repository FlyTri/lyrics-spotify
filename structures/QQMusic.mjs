import axios from "axios";
import {
  INSTRUMENTAL,
  DJ,
  formatText,
  formatTime,
  omitUndefined,
  trim,
} from "../utils.mjs";
import { qrc as QRC } from "smart-lyric";

const instance = axios.create({
  baseURL: "https://u.y.qq.com/cgi-bin",
});

instance.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.resolve(null)
);

export default class QQMusic {
  async #getID(name, artist) {
    const data = await instance.post("https://u.y.qq.com/cgi-bin/musicu.fcg", {
      comm: {
        ct: "19",
        cv: "1859",
        uin: "0",
      },
      req: {
        method: "DoSearchForQQMusicDesktop",
        module: "music.search.SearchCgiService",
        param: {
          num_per_page: 5,
          page_num: 1,
          query: name + " - " + artist,
          search_type: 0,
        },
      },
    });

    if (!data) return;

    const songs = data.req.data.body.song.list;
    const sortedArtists = String(artist.toUpperCase().split(", ").sort());

    if (!songs.length) return;

    const song = songs.find(
      (song) =>
        song.name.toUpperCase() === name.toUpperCase() &&
        song.title.toUpperCase() === name.toUpperCase() &&
        String(
          song.singer.map((singer) => singer.name.toUpperCase()).sort()
        ) === sortedArtists &&
        String(
          song.singer.map((singer) => singer.title.toUpperCase()).sort()
        ) === sortedArtists
    );

    return song?.id;
  }
  async getLyrics({ name, artist }, id) {
    const songID = id || (await this.#getID(name, artist));

    if (!songID) return;

    const data = await instance.post("https://u.y.qq.com/cgi-bin/musicu.fcg", {
      "music.musichallSong.PlayLyricInfo.GetPlayLyricInfo": {
        method: "GetPlayLyricInfo",
        module: "music.musichallSong.PlayLyricInfo",
        pcachetime: Date.now(),
        param: {
          crypt: 0,
          qrc: 1,
          songID,
        },
      },
    });

    if (!data) return;

    const { qrc, lyric } =
      data["music.musichallSong.PlayLyricInfo.GetPlayLyricInfo"]?.data || {};

    if (!lyric) return;

    let decrypted = qrc
      ? QRC.decrypt(Buffer.from(lyric, "hex"))
      : Buffer.from(lyric, "base64").toString();
    const single = /[\n\r]/.test(decrypted)
      ? ""
      : decrypted.replace(/\(\d+,\d+\)\(\d+,\d+\)/g, "");

    if (single.includes("此歌曲为DJ歌请您欣赏")) return DJ;
    if (single.includes("此歌曲为没有填词的纯音乐，请您欣赏"))
      return INSTRUMENTAL;

    let parsed;
    if (qrc) parsed = this.#parseTextSynced(decrypted);
    else {
      decrypted = trim(decrypted);

      if (decrypted[0] === "[") parsed = this.#parseLineSynced(decrypted);
      else parsed = this.#parseNotSynced(decrypted);
    }

    const { type, lyrics } = parsed;

    return {
      type,
      data: lyrics,
      translated: [],
      source: "Cung cấp bởi QQ Music",
    };
  }

  #parseNotSynced(decrypt) {
    const splitted = decrypt.split(/\r?\n/);
    const parsed = splitted.map((text) => ({
      text: formatText(text) || "",
    }));

    return { type: "NOT_SYNCED", lyrics: parsed };
  }
  #parseTextSynced(decrypted) {
    const lyric = /LyricContent="((.|\r|\n)*)"\/>/.exec(decrypted)[1].trim();
    const splitted = trim(lyric)
      .replace(/\(\d+,\d+\)\(\d+,\d+\)/g, "")
      .split(/\r?\n/);
    let data = [];
    let first = true;
    let checkHeader = true;

    splitted.forEach((line) => {
      if (/^\[\s*(\d+)\s*,\s*(\d+)\s*\](.*)$/.test(line)) {
        const [timetag, lineStart, lineDuration] = /\[(\d*),(\d*)\]/.exec(line);
        const content = line.replace(timetag, "");

        if (checkHeader) {
          if (first) {
            first = false;

            return;
          }
          if (content.includes(":") || content.includes("：")) return;

          checkHeader = false;
        }

        const words = [...content.matchAll(/(.*?)\((\d*),(\d*)\)/g)];

        words.forEach(([, text, ws], i) => {
          if (!text) return;

          const space = words[i + 1]?.[1] === " " ? " " : "";
          const before = data.findLast((obj) => obj.new);

          if (i === 0 && before && ws - before.lineEnd >= 3000)
            data.push({
              time: before.lineEnd,
              wait: true,
              new: true,
            });

          data.push(
            omitUndefined({
              text: formatText(text) + space,
              time: +ws,
              new: i === 0 || undefined,
              lineEnd: i === 0 ? +lineStart + +lineDuration : undefined,
            })
          );
        });
      }
    });

    if (data[0].time) data.unshift({ time: 0, wait: true });

    return { type: "TEXT_SYNCED", lyrics: data };
  }
  #parseLineSynced(decrypted) {
    const splitted = decrypted.split(/\r?\n/);
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

    return {
      type: "LINE_SYNCED",
      lyrics: data,
    };
  }
}
