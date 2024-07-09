import axios from "axios";
import fs from "fs";
import { INSTRUMENTAL, formatText, trim } from "../utils.mjs";

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
      usertoken: tokens[Math.floor(Math.random() * tokens.length)],
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
            ? "Yêu cầu captcha từ nguồn cung cấp"
            : "Không thể tìm lời bài hát :(",
      };

    const body = data.message.body.macro_calls;
    const { track } = body["matcher.track.get"].message.body;

    if (!track) return;

    if (track.instrumental) return INSTRUMENTAL;

    const lyrics = body["track.lyrics.get"].message.body?.lyrics;
    const lyricsData = lyrics?.lyrics_body;

    if (!lyricsData) return;

    const richsync = body["track.richsync.get"].message.body?.richsync;
    const richsyncData = richsync?.richsync_body;
    const { subtitle_list } = body["track.subtitles.get"].message.body;
    const translated = await this.translate(
      track.track_id,
      lyrics.lyrics_language
    );

    if (track.has_richsync && richsyncData) {
      const data = [];

      JSON.parse(trim(richsyncData)).forEach((obj) =>
        obj.l.forEach((line, i) => {
          if (!line.c) return;

          const start = (obj.ts + line.o) * 1000;
          const space = obj.l[i + 1]?.c === " " ? " " : "";
          const before = data.findLast((obj) => obj.new);

          if (i === 0 && before && start - before.end > 5000)
            data.push({
              text: "",
              time: before.end,
              new: true,
            });

          data.push({
            time: start,
            end: i === 0 ? obj.te * 1000 : undefined,
            text: formatText(line.c) + space,
            new: i === 0 ? true : undefined,
          });
        })
      );

      if (data[0].time) data.unshift({ time: 0, wait: true });

      return {
        type: "TEXT_SYNCED",
        data,
        translated,
        source: "Cung cấp bởi Musixmatch",
      };
    }

    if (track.has_subtitles && subtitle_list) {
      const data = JSON.parse(
        trim(subtitle_list[0].subtitle.subtitle_body)
      ).map(({ text, time }) => ({
        text: formatText(text),
        time: time.total * 1000,
      }));

      if (data[0].time) data.unshift({ time: 0, wait: true });

      return {
        type: "LINE_SYNCED",
        data,
        translated,
        source: "Cung cấp bởi Musixmatch",
      };
    }

    return {
      type: "NOT_SYNCED",
      data: trim(lyricsData)
        .split("\n")
        .map((text) => ({
          text: formatText(text) || "",
        })),
      translated,
      source: "Cung cấp bởi Musixmatch",
    };
  }

  /**
   *
   * @param {{name: string, album: string, artist: string, id: string, duration: number}} param0
   * @returns {Promise<LyricsData | { message: string }>}
   */
  async getLyrics({ name, album, artist, id, duration }) {
    const data = await instance("/macro.subtitles.get", {
      params: {
        q_album: album,
        q_artists: artist,
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

    return data.message.body.translations_list.map(({ translation }) => ({
      original: formatText(translation.matched_line),
      text: translation.description,
    }));
  }
}
