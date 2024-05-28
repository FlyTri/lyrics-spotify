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

// Web server
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app
  .use(express.static(path.join(__dirname, "public")))
  .get("/api/lyrics", (req, res) => {
    if (!req.query.name || !req.query.id) return res.sendStatus(400);

    const callAPI = () => {
      return axios.get(MusixmatchBaseURL + "macro.subtitles.get", {
        params: {
          format: "json",
          namespace: "lyrics_richsynched",
          app_id: "web-desktop-app-v1.0",
          subtitle_format: "mxm",
          q_track: req.query.name,
          track_spotify_id: req.query.id,
          usertoken: MusixmatchToken,
        },
        headers: {
          authority: "apic-desktop.musixmatch.com",
          cookie: "x-mxm-token-guid=",
        },
      });
    };
    const getTextSynced = async (commontrack_id) =>
      axios
        .get(MusixmatchBaseURL + "track.richsync.get", {
          params: {
            format: "json",
            app_id: "web-desktop-app-v1.0",
            subtitle_format: "mxm",
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
    const handleAPIResponse = async (response) => {
      if (response.data.message.header.status_code === 200) {
        const body = response.data.message.body;

        if (
          body.macro_calls["track.lyrics.get"].message.header.status_code ===
            404 ||
          !body.macro_calls["track.lyrics.get"].message.body.lyrics.lyrics_body
        )
          return res.status(404).send({ message: "Không có kết quả" });

        const track = body.macro_calls["matcher.track.get"].message.body.track;

        // Text synced
        if (track.has_richsync) {
          const textSynced = await getTextSynced(
            body.macro_calls["matcher.track.get"].message.body.track
              .commontrack_id
          );

          if (textSynced) {
            let count = 0;
            const data = textSynced.map((obj) =>
              obj.l.map((data) => ({
                text: data.c,
                time: obj.ts + data.o,
                index: count++ + 1,
              }))
            );
            if (data[0][0].time) data.unshift([{ index: -1, time: 0 }]);

            return res.send({
              type: "TEXT_SYNCED",
              data: data,
            });
          }
        }

        // Line synced
        if (track.has_subtitles) {
          const data = JSON.parse(
            body.macro_calls["track.subtitles.get"].message.body
              .subtitle_list[0].subtitle.subtitle_body
          ).map(({ text, time }, i) => ({ text, index: i, time: time.total }));

          if (data[0].time) data.unshift({ index: -1, time: 0 });
          return res.send({
            type: "LINE_SYNCED",
            data,
          });
        }

        // Not synced
        return res.send({
          type: "NOT_SYNCED",
          data: body.macro_calls[
            "track.lyrics.get"
          ].message.body.lyrics.lyrics_body
            .split("\n")
            .map((text) => ({ text: text || "" })),
        });
      } else {
        res.status(500).send({
          message:
            response.data.message.header.hint === "captcha"
              ? "Hiện có quá nhiều yêu cầu. Hãy thử lại sau"
              : "Không thể tìm lời bài hát",
        });
      }
    };

    callAPI()
      .then(async (response) => {
        if (response.data.message.header.status_code === 401) {
          await getToken();

          const newResponse = await callAPI();

          await handleAPIResponse(newResponse);
        } else {
          await handleAPIResponse(response, res);
        }
      })
      .catch((error) => {
        res.status(500).send({ message: "Không thể tìm lời bài hát" });
        console.error(error);
      });
  })
  .listen(PORT);
