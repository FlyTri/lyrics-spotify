import axios from "axios";
import _ from "lodash";
import { INSTRUMENTAL, DJ, formatText, omitUndefined } from "../utils.mjs";
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

    if (!songs.length) return;

    const song = songs.find(
      (song) => song.title.toUpperCase() === name.toUpperCase()
    );

    return song?.id;
  }
  async getLyrics({ name, artist }) {
    const songID = await this.#getID(name, artist);

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

    const LyricInfo =
      data["music.musichallSong.PlayLyricInfo.GetPlayLyricInfo"]?.data;
    const { qrc, lyric } = LyricInfo || {};

    if (!lyric) return;

    const decrypted = qrc
      ? QRC.decrypt(Buffer.from(lyric, "hex"))
      : Buffer.from(lyric, "base64").toString();

    if (
      "此歌曲为DJ歌请您欣赏"
        .split("")
        .every((character) => decrypted.includes(character))
    )
      return DJ;
    if (decrypted.includes("此歌曲为没有填词的纯音乐，请您欣赏"))
      return INSTRUMENTAL;

    if (qrc) {
      const parsed = this.parseSynced(decrypted, { name, artist });

      return {
        type: "TEXT_SYNCED",
        data: parsed.lyrics,
        translated: [],
        source: "Cung cấp bởi QQ Music",
      };
    } else {
      const decrypted = Buffer.from(lyric, "base64").toString();
      const splitted = decrypted.split("\n");

      if (!splitted[0].startsWith("["))
        return {
          type: "NOT_SYNCED",
          data: splitted.map((text) => ({
            text: formatText(text) || "",
          })),
          translated: [],
          source: "Cung cấp bởi QQ Music",
        };
    }
  }
  parseSynced(decrypted, { name, artist }) {
    const lyric = /LyricContent="((.|\r|\n)*)"\/>/.exec(decrypted)[1].trim();
    const splitted = lyric.split(/\r?\n/);
    const tag = {};
    let data = [];
    let first = true;
    let checkHeader = true;

    splitted.forEach((line) => {
      if (/^\[\s*(\d+)\s*,\s*(\d+)\s*\](.*)$/.test(line)) {
        const [timetag] = line.match(/\[(\d*),(\d*)\]/);
        const content = line.replace(timetag, "");

        if (checkHeader) {
          if (first) return (first = false);
          if (content.includes(":") || content.includes("：")) return;

            checkHeader = false;
        }

        const words = [...content.matchAll(/(.*?)\((\d*),(\d*)\)/g)];
        const [, , lws, lwd] = words[words.length - 1];

        words.forEach(([, text, ws], i) => {
          if ((!text && i) || text === " ") return;
          const nextCharIsSpace = words[i + 1]?.[1] === " ";

          data.push(
            omitUndefined({
              text: formatText(text) + (nextCharIsSpace ? " " : ""),
              time: +ws / 1000,
              new: i === 0 || undefined,
              end: i === 0 ? (+lws + +lwd) / 1000 : undefined,
            })
          );
        });
      } else {
        const matches = line.match(/^\[([a-zA-Z#]\w*):(.*)\]$/);

        if (matches) {
          const [key, value] = [matches[1], matches[2]];

          tag[key] = value.trim();
        }
      }
    });

    if (data[0].time) data.unshift({ time: 0, wait: true });

    return { lyrics: data, tag };
  }
}
