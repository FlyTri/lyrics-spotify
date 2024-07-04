import axios from "axios";
import {
  NO_RESULT,
  INSTRUMENTAL,
  DJ,
  formatText,
  replaceSpecialCharacters,
} from "../utils.mjs";
import { qrc as QRC } from "smart-lyric";
import _ from "lodash";

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
      (song) => _.upperCase(song.title) === _.upperCase(name)
    );

    return song?.id;
  }
  async getLyrics(name, artist) {
    const songID = await this.#getID(name, artist);

    if (!songID) return NO_RESULT;

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

    if (!data) return NO_RESULT;

    const music = data["music.musichallSong.PlayLyricInfo.GetPlayLyricInfo"];

    if (!music) return NO_RESULT;

    const { qrc, lyric } = music.data;

    if (!lyric) return NO_RESULT;

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
      const parsed = this.parseSynced(decrypted);

      return {
        type: "TEXT_SYNCED",
        data: parsed.lyrics,
        translated: [],
        source: "Cung cấp bởi QQ Music",
      };
    } else {
      const decrypted = Buffer.from(lyric, "base64").toString();
      const splitted = decrypted.split("\n");
      console.log(splitted);
      if (!splitted[0].startsWith("["))
        return {
          type: "NOT_SYNCED",
          data: _.map(splitted, (text) => ({
            text: formatText(text) || "",
          })),
          translated: [],
          source: "Cung cấp bởi QQ Music",
        };
    }
  }
  parseSynced(decrypted) {
    const lyric = /LyricContent="((.|\r|\n)*)"\/>/.exec(decrypted)[1].trim();
    const tag = {};
    let checkHeader = true;
    const data = _.chain(lyric)
      .split(/\r?\n/)
      .flatMap((line) => {
        if (/^\[\s*(\d+)\s*,\s*(\d+)\s*\](.*)$/.test(line)) {
          const [timetag] = line.match(/\[(\d*),(\d*)\]/);
          const content = line.replace(timetag, "");

          const words = _.toArray(content.matchAll(/(.*?)\((\d*),(\d*)\)/g));

          if (checkHeader && this.#isHeader(tag, _.map(words, 1).join("")))
            return;

          checkHeader = false;

          const [, , lws, lwd] = _.last(words);

          return _.flatMap(words, ([, text, ws], i) => {
            if ((!text && i) || text === " ") return;
            const nextCharIsSpace = _.get(words, [i + 1, 1]) === " ";

            return _.omitBy(
              {
                text: formatText(text) + (nextCharIsSpace ? " " : ""),
                time: _.toNumber(ws) / 1000,
                new: i === 0 || undefined,
                end:
                  i === 0
                    ? (_.toNumber(lws) + _.toNumber(lwd)) / 1000
                    : undefined,
              },
              _.isNil
            );
          });
        } else {
          const matches = line.match(/^\[([a-zA-Z#]\w*):(.*)\]$/);

          if (matches) {
            const [key, value] = [matches[1], matches[2]];

            tag[key] = value.trim();
          }
        }
      })
      .filter(_.isObject)
      .value();

    if (data[0].time) data.unshift({ time: 0, wait: true });
    return { lyrics: data, tag };
  }
  /**
   *
   * @param {object} param0
   * @param {string} content
   * @returns
   */
  #isHeader({ ti, ar }, content) {
    const infoRegex = /^.*:/;

    return (
      content.startsWith(ti + " - ") ||
      (content.startsWith(ti) && content.includes(ar)) ||
      infoRegex.test(replaceSpecialCharacters(content))
    );
  }
}
