import axios from "axios";
import fs from "fs";
import { lrc as parseLRC } from "./Parser";
import { INSTRUMENTAL, formatText, trim } from "../utils";
import { MusixmatchLyricsResponse } from "../../types/Musixmatch";
import { TextSyncedData } from "../../types/global";

const { tokens } = JSON.parse(
  fs.readFileSync("MusixmatchTokens.json", "utf-8")
);

export default class Musixmatch {
  async #handleAPIResponse(data: MusixmatchLyricsResponse) {
    const { status_code } = data.message.header;

    if (status_code !== 200)
      return {
        message: "Không thể tìm lời bài hát :(",
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

    if (richsyncData) {
      const data: (TextSynced | Interlude)[] = [];

      JSON.parse(trim(richsyncData)).forEach(
        (obj: { ts: number; te: number; l: Array<{ c: string; o: number }> }) =>
          obj.l.forEach((line, i) => {
            if (!line.c.trim()) return;

            const start = (obj.ts + line.o) * 1000;
            const space = obj.l[i + 1]?.c === " " ? " " : "";
            const before = data.findLast((obj) => obj.new);

            if (
              i === 0 &&
              before &&
              "lineEnd" in before &&
              start - before.lineEnd! >= 3000
            )
              data.push({
                time: before.lineEnd!,
                wait: true,
                new: true,
              });

            data.push({
              text: formatText(line.c) + space,
              time: start,
              new: i === 0 ? true : undefined,
              lineEnd: i === 0 ? obj.te * 1000 : undefined,
            });
          })
      );

      if (data[0].time) data.unshift({ time: 0, wait: true });

      return {
        type: "TEXT_SYNCED",
        data,
        source: "Cung cấp bởi Musixmatch",
      } as TextSyncedData;
    }

    if (subtitle_list) {
      const data = parseLRC(subtitle_list[0].subtitle.subtitle_body).lyrics;

      return {
        type: "LINE_SYNCED",
        data,
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
      source: "Cung cấp bởi Musixmatch",
    };
  }

  /**
   *
   * @param {{name: string, album: string, artist: string, id: string, duration: number}} param0
   * @returns {Promise<LyricsData | { message: string }>}
   */
  async getLyrics({ name, album, artists, id, duration }: SpotifyTrackData) {
    const data = await axios(
      "https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get",
      {
        params: {
          q_album: album,
          q_artists: artists,
          q_track: name,
          track_spotify_id: id,
          q_duration: Math.round(duration / 1000),
          f_subtitle_length: Math.round(duration / 1000),
          namespace: "lyrics_richsynched",
          subtitle_format: "lrc",
          optional_calls: "track.richsync",
          format: "json",
          app_id: "web-desktop-app-v1.0",
          usertoken: tokens[Math.floor(Math.random() * tokens.length)],
        },
        headers: {
          authority: "apic-desktop.musixmatch.com",
          cookie: "x-mxm-token-guid=",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Musixmatch/0.19.4 Chrome/58.0.3029.110 Electron/1.7.6 Safari/537.36",
        },
      }
    )
      .then((response) => response.data as MusixmatchLyricsResponse)
      .catch(() => null);

    if (data) {
      const lyricsData = await this.#handleAPIResponse(data);

      return lyricsData;
    }

    return { message: "Không thể tìm lời bài hát" };
  }
}
