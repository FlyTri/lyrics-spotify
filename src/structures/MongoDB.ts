import { Schema, connect, connections, model } from "mongoose";

import { Lyrics } from "../types";

const schema = new Schema({
  id: { type: String, required: true },
  lyrics: { type: Object }, // Lyrics
  provider: {
    type: String,
    enum: ["qq", "musixmatch", "zingmp3"],
  },
  songId: { type: Schema.Types.Mixed }, // number | string
});

export default class MongoDB {
  constructor() {
    const date = Date.now();

    connect(process.env.MONGODB_URI!, {
      dbName: "lyrics-spotify",
      compressors: "snappy",
      retryReads: true,
      socketTimeoutMS: 0,
      connectTimeoutMS: 0,
      waitQueueTimeoutMS: 0,
    }).then(() => {
      console.log(
        `Successfully connected to MongoDB database\n> Took ${
          Date.now() - date
        }ms`
      );
    });

    connections[0]
      .on("error", (error) => {
        console.log(`MongoDB error: ${error.message}`);
      })
      .on("disconnected", () => {
        console.log("Disconnected from MongoDB database");
      })
      .on("reconnected", () => {
        console.log("Successfully reconnected to MongoDB database");
      });
  }
  async getLyrics(
    track: SpotifyTrackData,
    sources: Sources
  ): Promise<Lyrics | undefined> {
    if (connections[0].readyState !== 1) return;

    const db = await model("Lyrics", schema, "Lyrics")
      .findOne({
        id: String(track.id),
      })
      .catch(() => null);

    if (!db) return;
    if (db.provider) {
      const data = await sources[db.provider].getLyrics(
        track,
        db.songId ?? undefined
      );

      if (data && "source" in data && data.source) {
        data.source += ", được chọn lọc bởi Lyrics Spotify";

        return data;
      }

      return;
    }
    if (db.lyrics?.data)
      db.lyrics.source = "Cung cấp bởi kho lưu trữ của Lyrics Spotify";

    return db.lyrics;
  }
}
