import axios from "axios";
import { INSTRUMENTAL, DJ } from "../utils";
import { qrc as QRC } from "smart-lyric";
import { lrc as parseLRC, qrc as parseQRC, plain } from "./Parser";

import {
  QQMusicLyricsResponse,
  QQMusicSearchResponse,
} from "../types/QQMusic";

const instance = axios.create({
  baseURL: "https://u.y.qq.com/cgi-bin",
});

instance.interceptors.response.use(
  (response) => response.data,
  () => Promise.resolve(null)
);

export default class QQMusic {
  async #getID(name: string, artists: string) {
    const data: QQMusicSearchResponse | null = await instance.post(
      "/musicu.fcg",
      {
        req: {
          method: "DoSearchForQQMusicDesktop",
          module: "music.search.SearchCgiService",
          param: {
            num_per_page: 5,
            page_num: 1,
            query: `${name} - ${artists}`,
            search_type: 0,
          },
        },
      }
    );

    if (!data) return;

    const songs = data.req.data.body.song.list;
    const sortedArtists = String(artists.toUpperCase().split(", ").sort());

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
  async getLyrics({ name, artists }: SpotifyTrackData, id?: number) {
    const songID = id ?? (await this.#getID(name, artists));

    if (!songID) return;

    const data: QQMusicLyricsResponse | null = await instance.post(
      "/musicu.fcg",
      {
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
      }
    );

    if (!data) return;

    const { qrc, lyric } =
      data["music.musichallSong.PlayLyricInfo.GetPlayLyricInfo"]?.data || {};

    if (!lyric) return;

    const decrypted = qrc
      ? QRC.decrypt(Buffer.from(lyric, "hex"))!
      : Buffer.from(lyric, "base64").toString();
    const single = /[\n\r]/.test(decrypted)
      ? ""
      : decrypted.replace(/\(\d+,\d+\)\(\d+,\d+\)/g, "");

    if (single.includes("此歌曲为DJ歌请您欣赏")) return DJ;
    if (single.includes("此歌曲为没有填词的纯音乐，请您欣赏"))
      return INSTRUMENTAL;

    let parsed;
    if (qrc)
      parsed = parseQRC(/LyricContent="((.|\r|\n)*)"\/>/.exec(decrypted)![1]);
    else if (decrypted.startsWith("[")) parsed = parseLRC(decrypted);
    else parsed = plain(decrypted);

    const { type, lyrics } = parsed;

    return {
      type,
      data: lyrics,
      source: "Cung cấp bởi QQ Music",
    };
  }
}
