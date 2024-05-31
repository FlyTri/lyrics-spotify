import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const { PORT } = process.env;
let MusixmatchToken = "0";
const MusixmatchBaseURL = "https://apic-desktop.musixmatch.com/ws/1.1/";
const getToken = async () =>
  axios
    .get(MusixmatchBaseURL + "token.get", {
      params: {
        app_id: "web-desktop-app-v1.0",
      },
      headers: {
        authority: "apic-desktop.musixmatch.com",
        cookie: "x-mxm-token-guid=",
      },
    })
    .then((response) => {
      switch (response.data.message.header.status_code) {
        case 200: {
          MusixmatchToken = response.data.message.body.user_token;
          console.log("Token refreshed:", MusixmatchToken);
          return "Success";
        }
        case 401: {
          return "Too many attempts on the server side";
        }
        default: {
          return "Failed to refresh token";
        }
      }
    })
    .catch((error) => {
      console.log(error);
      return "Failed to refresh token";
    });

getToken().then(console.log);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app
  .use(express.static(path.join(__dirname, "public")))
  .get("/api/lyrics", (req, res) => {
    const { name, album, artist, id, duration } = req.query;
    if (!name || !album || !artist || !id || !duration)
      return res.sendStatus(400);

    const callAPI = () =>
      axios.get(MusixmatchBaseURL + "macro.subtitles.get", {
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
          usertoken: MusixmatchToken,
        },
        headers: {
          authority: "apic-desktop.musixmatch.com",
          cookie: "x-mxm-token-guid=",
        },
      });

    const getTextSynced = async ({ commontrack_id, track_length }) =>
      axios
        .get(MusixmatchBaseURL + "track.richsync.get", {
          params: {
            format: "json",
            app_id: "web-desktop-app-v1.0",
            subtitle_format: "mxm",
            f_subtitle_length: track_length,
            q_duration: track_length,
            commontrack_id,
            usertoken: MusixmatchToken,
          },
          headers: {
            authority: "apic-desktop.musixmatch.com",
            cookie: "x-mxm-token-guid=",
          },
        })
        .then((response) =>
          JSON.parse(response.data.message.body.richsync.richsync_body)
        )
        .catch(() => null);

    const checkStatusCode = (response) =>
      response.data.message.header.status_code === 200;
    const isLyricsNotFound = (body) =>
      body["track.lyrics.get"].message.header.status_code === 404 ||
      !body["track.lyrics.get"].message.body.lyrics.lyrics_body;
    const getTextSyncedData = async (body) => {
      const textSynced = await getTextSynced(
        body["matcher.track.get"].message.body.track
      );
      if (!textSynced) return null;
      let count = 0;
      const data = textSynced.map((obj) =>
        obj.l.map((data) => ({
          text: data.c,
          time: obj.ts + data.o,
          index: count++ + 1,
        }))
      );
      if (data[0][0].time) data.unshift([{ index: -1, time: 0 }]);
      return data;
    };

    const getLineSyncedData = (body) => {
      const data = JSON.parse(
        body["track.subtitles.get"].message.body.subtitle_list[0].subtitle
          .subtitle_body
      ).map(({ text, time }, i) => ({ text, index: i, time: time.total }));
      if (data[0].time) data.unshift({ index: -1, time: 0 });
      return data;
    };

    const translate = (id, language) =>
      axios
        .get(
          "https://apic-desktop.musixmatch.com/ws/1.1/crowd.track.translations.get",
          {
            params: {
              selected_language: language === "vi" ? "en" : "vi",
              comment_format: "text",
              format: "json",
              app_id: "web-desktop-app-v1.0",
              track_id: id,
              usertoken: MusixmatchToken,
            },
            headers: {
              authority: "apic-desktop.musixmatch.com",
              cookie: "x-mxm-token-guid=",
            },
          }
        )
        .then((response) =>
          response.data.message.body.translations_list?.map(
            ({ translation }) => ({
              original: translation.matched_line,
              text: translation.description,
            })
          )
        )
        .catch(() => null);

    const handleAPIResponse = async (response) => {
      if (!checkStatusCode(response)) {
        return res.status(500).send({
          message:
            response.data.message.header.hint === "captcha"
              ? "Hiện có quá nhiều yêu cầu. Hãy thử lại sau"
              : "Không thể tìm lời bài hát",
        });
      }

      const body = response.data.message.body.macro_calls;

      if (isLyricsNotFound(body)) {
        return res.status(404).send({ message: "Không có kết quả" });
      }

      const { track } = body["matcher.track.get"].message.body;
      const language =
        body["track.lyrics.get"].message.body.lyrics.lyrics_language;

      if (track.has_richsync && body["matcher.track.get"].message.body) {
        const data = await getTextSyncedData(body);
        if (data)
          return res.send({
            type: "TEXT_SYNCED",
            data,
            translated: await translate(track.track_id, language),
          });
      }

      if (
        track.has_subtitles &&
        body["track.subtitles.get"].message.body.subtitle_list
      ) {
        const data = getLineSyncedData(body);
        return res.send({
          type: "LINE_SYNCED",
          data,
          translated: await translate(track.track_id, language),
        });
      }

      const lyricsData = bodmacro_calls[
        "track.lyrics.get"
      ].message.body.lyrics.lyrics_body
        .split("\n")
        .map((text) => ({ text: text || "" }));

      return res.send({
        type: "NOT_SYNCED",
        data: lyricsData,
        translated: await translate(track.track_id, language),
      });
    };

    callAPI()
      .then(async (response) => {
        if (response.data.message.header.status_code === 401) {
          await getToken();

          const newResponse = await callAPI();

          await handleAPIResponse(newResponse);
        } else {
          await handleAPIResponse(response);
        }
      })
      .catch((error) => {
        res.status(500).send({ message: "Không thể tìm lời bài hát" });
        console.error(error);
      });
  })
  .listen(PORT);
