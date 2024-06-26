import axios from "axios";
import { isJapanese, toRomaji, tokenize } from "wanakana";
import { pinyin } from "pinyin-pro";
import aromanize from "aromanize";

export default class Musixmatch {
  /**
   *
   * @param {import("./Redis.mjs").default} redis
   */
  constructor(redis) {
    this.get = axios.create({
      baseURL: "https://apic-desktop.musixmatch.com/ws/1.1",
      headers: {
        authority: "apic-desktop.musixmatch.com",
        cookie: "x-mxm-token-guid=",
      },
    }).get;

    this.redis = redis;
    this.token = null;
    this.#getNewAccessToken();
  }
  /**
   *
   * @returns {Promise<boolean>}
   */
  async #getNewAccessToken() {
    return this.get("/token.get", {
      params: {
        app_id: "web-desktop-app-v1.0",
      },
    })
      .then((response) => {
        switch (response.data.message.header.status_code) {
          case 200: {
            console.log("Successfully refreshed Musixmatch token");
            this.token = response.data.message.body.user_token;

            return true;
          }
          case 401: {
            console.log("Too many attempts on the server side");

            return false;
          }
          default: {
            console.log(
              `Failed to refresh Musixmatch token with status code ${response.data.message.header.status_code}`
            );

            return false;
          }
        }
      })
      .catch(() => {
        console.log("Failed to refresh Musixmatch token");

        return false;
      });
  }
  /**
   *
   * @param {string} text
   * @returns {string}
   */
  #format(text) {
    if (!text) return "";
    if (/^\s+$/.test(text)) return " ";

    const words = tokenize(text);
    const Chinese = /\p{Script=Han}/u;
    const Korean = /\p{Script=Hangul}/u;
    const replacements = [
      { from: "（", to: "(" },
      { from: "）", to: ")" },
      { from: "【", to: "[" },
      { from: "】", to: "]" },
      { from: "。", to: ". " },
      { from: "；", to: "; " },
      { from: "：", to: ": " },
      { from: "？", to: "? " },
      { from: "！", to: "! " },
      { from: "、", to: ", " },
      { from: "，", to: ", " },
      { from: "‘", to: "'" },
      { from: "’", to: "'" },
      { from: "′", to: "'" },
      { from: "＇", to: "'" },
      { from: "“", to: '"' },
      { from: "”", to: '"' },
      { from: "〜", to: "~" },
      { from: "·", to: "•" },
      { from: "・", to: "•" },
    ];

    words.forEach((word, index) => {
      if (Chinese.test(word)) word = pinyin(word);
      else if (isJapanese(word)) word = toRomaji(word);
      else if (Korean.test(word)) word = aromanize.romanize(word);

      words[index] = word;
    });

    replacements.forEach((pair) => {
      const regex = new RegExp(pair.from, "g");
      text = text.replaceAll(regex, pair.to);
    });

    return words.join("");
  }

  /**
   *
   * @param {import("axios").AxiosResponse} response
   * @returns
   */
  async #handleAPIResponse(response) {
    const { status_code, hint } = response.data.message.header;

    if (status_code !== 200) {
      return {
        message:
          hint === "captcha"
            ? "Hiện có quá nhiều yêu cầu. Hãy thử lại sau"
            : "Không thể tìm lời bài hát",
      };
    }

    const body = response.data.message.body.macro_calls;
    const lyrics = body["track.lyrics.get"].message.body?.lyrics;
    const lyricsData = lyrics?.lyrics_body;

    if (!lyricsData) return { message: "Không có kết quả" };

    const { track } = body["matcher.track.get"].message.body;
    const translate = () =>
      this.translate(track.track_id, lyrics.lyrics_language);

    if (track.has_richsync) {
      const data = await this.getTextSynced(track);

      if (data)
        return {
          type: "TEXT_SYNCED",
          data,
          translated: await translate(),
        };
    }

    const { subtitle_list } = body["track.subtitles.get"].message.body;

    if (track.has_subtitles && subtitle_list) {
      const data = JSON.parse(subtitle_list[0].subtitle.subtitle_body).map(
        ({ text, time }, i) => ({
          text: this.#format(text),
          index: i + 1,
          time: time.total,
        })
      );
      if (data[0].time) data.unshift({ index: 0, time: 0 });

      return {
        type: "LINE_SYNCED",
        data,
        translated: await translate(),
      };
    }

    return {
      type: "NOT_SYNCED",
      data: lyricsData
        .split("\n")
        .map((text) => ({ text: this.#format(text) || "" })),
      translated: await translate(),
    };
  }
  /**
   *
   * @param {string} name
   * @param {string} album
   * @param {string} artist
   * @param {string} id
   * @param {number} duration
   * @returns {Promise<string|object>}
   */
  async getLyrics(name, album, artist, id, duration) {
    if (!this.token) await this.#getNewAccessToken();
    if (!this.token) return { message: "Chưa thể tìm lời bài hát vào lúc này" };

    let data;

    const call = () =>
      this.get("/macro.subtitles.get", {
        params: {
          format: "json",
          namespace: "lyrics_richsynched",
          app_id: "web-desktop-app-v1.0",
          subtitle_format: "mxm",
          q_album: album,
          q_artist: artist.split(";")[0],
          q_artists: artist.split(";")[0],
          q_track: name,
          track_spotify_id: "spotify:track:" + id,
          q_duration: Math.round(duration / 1000),
          f_subtitle_length: Math.round(duration / 1000),
          usertoken: this.token,
        },
      });

    await call().then(async (response) => {
      if (response.data.message.header.status_code === 401) {
        await this.#getNewAccessToken();

        const newResponse = await call();

        data = await this.#handleAPIResponse(newResponse);
      } else {
        data = await this.#handleAPIResponse(response);
      }
    });
    // .catch(() => {
    //   data = { message: "Không thể tìm lời bài hát" };
    // });

    return data;
  }
  /**
   *
   * @param {object} param0 Track object
   * @returns
   */
  async getTextSynced({ commontrack_id, track_length }) {
    const textSynced = await this.get("/track.richsync.get", {
      params: {
        format: "json",
        app_id: "web-desktop-app-v1.0",
        subtitle_format: "mxm",
        f_subtitle_length: track_length,
        q_duration: track_length,
        commontrack_id,
        usertoken: this.token,
      },
    })
      .then((response) =>
        JSON.parse(response.data.message.body.richsync.richsync_body)
      )
      .catch(() => null);

    if (!textSynced) return null;

    let count = 0;
    const data = textSynced.map((obj) =>
      obj.l.map((data, i) =>
        JSON.parse(
          JSON.stringify({
            text: this.#format(data.c),
            time: obj.ts + data.o,
            index: count++ + 1,
            newLine: i === 0 ? true : undefined,
          })
        )
      )
    );
    if (data[0][0].time) data.unshift([{ index: 0, time: 0 }]);

    return data;
  }
  /**
   *
   * @param {number} id Musixmatch track id
   * @param {string} language
   * @returns
   */
  async translate(id, language) {
    return this.get("/crowd.track.translations.get", {
      params: {
        selected_language: language === "vi" ? "en" : "vi",
        comment_format: "text",
        format: "json",
        app_id: "web-desktop-app-v1.0",
        track_id: id,
        usertoken: this.token,
      },
    })
      .then((response) =>
        response.data.message.body.translations_list?.map(
          ({ translation }) => ({
            original: translation.matched_line,
            text: translation.description,
          })
        )
      )
      .catch(() => null);
  }
}
