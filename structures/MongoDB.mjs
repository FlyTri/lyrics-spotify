import { Schema, connect, connections, model } from "mongoose";

const schema = new Schema({
  id: { type: String, required: true },
  lyrics: { type: Object },
  provider: {
    type: String,
    enum: ["qq", "musixmatch", "zingmp3"],
    required: true,
  },
  songId: { type: Number },
});

export default class MongoDB {
  constructor() {
    const date = Date.now();

    connect(process.env.MONGODB_URI, {
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
  /**
   *
   * @param {object} options
   * @param {{musixmatch: import("./Musixmatch.mjs").default, qq: import("./QQMusic.mjs").default}} sources
   * @returns
   */
  async getLyrics(options, sources) {
    if (connections[0].readyState !== 1) return;

    const db = await model("Lyrics", schema, "Lyrics")
      .findOne({
        id: String(options.id),
      })
      .catch(() => null);

    if (!db) return;
    if (db.provider) {
      const data = await sources[db.provider].getLyrics(options, db.songId);

      if (data) {
        data.source += ", được chọn lọc bởi Lyrics Spotify";

        return data;
      }

      return;
    }
    if (db.lyrics.data)
      db.lyrics.source = "Cung cấp bởi kho lưu trữ của Lyrics Spotify";

    return db.lyrics;
  }
}
