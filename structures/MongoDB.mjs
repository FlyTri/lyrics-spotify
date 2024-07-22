import { connect, connections, model, Schema } from "mongoose";

const schema = new Schema({
  id: { type: String, required: true, match: /^[A-Za-z0-9]{22}$/ },
  provider: {
    type: String,
    enum: ["qq", "musixmatch", "zingmp3"],
    required: true,
  },
  songId: { type: Number },
});
const Lyrics = model("Lyrics", schema);

export default class MongoDB {
  constructor() {
    const date = Date.now();

    this.client = connect(process.env.MONGODB_URI).then(() =>
      console.log(
        `Successfully connected to MongoDB database\n> Took ${
          Date.now() - date
        }ms`
      )
    );

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
    if (!connections[0].readyState) return;

    const db = await Lyrics.findOne({ id: String(options.id) })
      .exec()
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
