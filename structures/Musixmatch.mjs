import axios from "axios";
import fs from "fs";
import _ from "lodash";
import { NO_RESULT, INSTRUMENTAL, formatText } from "../utils.mjs";

/**
 * @typedef {Object} LyricsData
 * @property {("TEXT_SYNCED" | "LINE_SYNCED" | "NOT_SYNCED" | "INSTRUMENTAL" | "NO_RESULT")} type
 * @property {Array<{ index: number, time: number, text: string | undefined, space: boolean | undefined, new: boolean | undefined }>} data
 * @property {Array<{ original: string, text: string }> | undefined} translated
 * @property {string | undefined} source
 */

const { tokens } = JSON.parse(fs.readFileSync("MusixmatchTokens.json"));
const instance = axios.create({
  baseURL: "https://apic-desktop.musixmatch.com/ws/1.1",
  headers: {
    authority: "apic-desktop.musixmatch.com",
    cookie: "x-mxm-token-guid=",
  },
  params: {
    format: "json",
    app_id: "web-desktop-app-v1.0",
    subtitle_format: "mxm",
  },
});

instance.interceptors.request.use(
  (config) => {
    config.params = {
      ...config.params,
      usertoken: _.sample(tokens),
    };
    return config;
  },
  (error) => Promise.reject(error)
);
instance.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.resolve(null)
);

export default class Musixmatch {
  /**
   * @private
   * @param {import("axios").AxiosResponse} response
   * @returns {Promise<LyricsData | { message: string }>}
   */
  async #handleAPIResponse(data) {
    const { status_code, hint } = data.message.header;

    if (status_code !== 200)
      return {
        message:
          hint === "captcha"
            ? "Máy chủ mệt rồi 😭"
            : "Không thể tìm lời bài hát :(",
      };

    const body = data.message.body.macro_calls;
    const { track } = body["matcher.track.get"].message.body;

    if (!track) return NO_RESULT;

    if (track.instrumental) return INSTRUMENTAL;

    const lyrics = body["track.lyrics.get"].message.body?.lyrics;
    const lyricsData = lyrics?.lyrics_body;

    if (!lyricsData) return NO_RESULT;

    const richsync = body["track.richsync.get"].message.body?.richsync;
    const richsyncData = richsync?.richsync_body;
    const { subtitle_list } = body["track.subtitles.get"].message.body;
    const translated = await this.translate(
      track.track_id,
      lyrics.lyrics_language
    );

    if (track.has_richsync && richsyncData) {
      const data = _.chain(JSON.parse(richsyncData))
        .flatMap((obj) =>
          _.flatMap(obj.l, (data, i) => {
            if (data.c !== " ") {
              const formattedText = formatText(data.c);
              const nextCharIsSpace = _.get(obj.l, [i + 1, "c"]) === " ";

              return {
                time: obj.ts + data.o,
                end: i === 0 ? obj.te : undefined,
                text: formattedText + (nextCharIsSpace ? " " : ""),
                new: i === 0 ? true : undefined,
              };
            }
          })
        )
        .filter(_.isObject)
        .value();

      if (data[0].time) data.unshift({ time: 0 });

      return {
        type: "TEXT_SYNCED",
        data,
        translated,
        source: "Cung cấp bởi Musixmatch",
      };
    }

    if (track.has_subtitles && subtitle_list) {
      const data = _.map(
        JSON.parse(subtitle_list[0].subtitle.subtitle_body),
        ({ text, time }) => ({
          text: formatText(text),
          time: time.total,
        })
      );

      if (data[0].time) data.unshift({ time: 0 });

      return {
        type: "LINE_SYNCED",
        data,
        translated,
        source: "Cung cấp bởi Musixmatch",
      };
    }

    return {
      type: "NOT_SYNCED",
      data: _.map(_.split(lyricsData, "\n"), (text) => ({
        text: formatText(text) || "",
      })),
      translated,
      source: "Cung cấp bởi Musixmatch",
    };
  }

  /**
   * @param {string} name
   * @param {string} album
   * @param {string} artist
   * @param {string} id
   * @param {number} duration
   * @returns {Promise<LyricsData | { message: string }>}
   */
  async getLyrics(name, album, artist, id, duration) {
    const data = await instance("/macro.subtitles.get", {
      params: {
        q_album: album,
        q_artist: _.head(artist.split(";")),
        q_artists: _.head(artist.split(";")),
        q_track: name,
        track_spotify_id: "spotify:track:" + id,
        q_duration: Math.round(duration / 1000),
        f_subtitle_length: Math.round(duration / 1000),
        namespace: "lyrics_richsynched",
        optional_calls: "track.richsync",
      },
    });

    if (data) {
      const lyricsData = await this.#handleAPIResponse(data);

      return lyricsData;
    }

    return { message: "Không thể tìm lời bài hát" };
  }
  /**
   * @param {number} id Musixmatch track id
   * @param {string} language
   * @returns {Promise<Array<{ original: string, text: string }> | null>}
   */
  async translate(id, language) {
    const data = await instance("/crowd.track.translations.get", {
      params: {
        selected_language: language === "vi" ? "en" : "vi",
        comment_format: "text",
        track_id: id,
      },
    });

    return _.map(data.message.body.translations_list, ({ translation }) => ({
      original: translation.matched_line,
      text: translation.description,
    }));
  }
}
