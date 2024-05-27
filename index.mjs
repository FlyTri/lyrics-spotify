import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const { PORT } = process.env;
let MusixmatchToken = "";
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
    const callAPI = () =>
      axios.get(MusixmatchBaseURL + "macro.subtitles.get", {
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

    callAPI()
      .then(async (response) => {
        if (response.data.message.header.status_code === 200) {
          if (
            !response.data.message.body.macro_calls["track.subtitles.get"]
              .message.body?.subtitle_list
          )
            return res.sendStatus(404);

          res.send(
            JSON.parse(
              response.data.message.body.macro_calls["track.subtitles.get"]
                .message.body.subtitle_list[0].subtitle.subtitle_body
            )
          );
        } else if (response.data.message.header.status_code === 401) {
          await getToken();
          callAPI().then(async (response) => {
            if (response.data.message.header.status_code === 200) {
              if (
                !response.data.message.body.macro_calls["track.subtitles.get"]
                  .message.body?.subtitle_list
              )
                return res.sendStatus(404);

              res.send(
                JSON.parse(
                  response.data.message.body.macro_calls["track.subtitles.get"]
                    .message.body.subtitle_list[0].subtitle.subtitle_body
                )
              );
            } else return res.send({ message: "Please try again later!" });
          });
        }
      })
      .catch((error) => {
        res.send({ message: "Please try again later!" });
        console.log(error);
      });
  })
  .listen(PORT);
