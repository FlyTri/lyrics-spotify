import { MongoClient } from "mongodb";

export default class MongoDB {
  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI, {
      compressors: "snappy",
      retryReads: true,
      retryWrites: false,
    });

    const date = Date.now();
    this.client.connect().then(() => {
      console.log(
        `Successfully connected to MongoDB database\n> Took ${
          Date.now() - date
        }ms`
      );
    });
    this.client
      .on("error", (error) => {
        console.log(`MongoDB error: ${error.message}`);
      })
      .on("close", () => {
        console.log("Disconnected from MongoDB database");
      });
    this.collection = this.client.db("lyrics-spotify").collection("Lyrics");
  }
  /**
   *
   * @param {object} options
   * @param {{musixmatch: import("./Musixmatch.mjs").default}} param1
   * @returns
   */
  async getLyrics(options, sources) {
    if (!this.client.topology) return;

    const data = await this.collection
      .findOne({ id: options.id })
      .catch(() => null);

    if (!data) return;
    if (data.provider) return await sources[data.provider].getLyrics(options);

    return {
      ...data.lyrics,
      source: "Cung cấp bởi kho lưu trữ của Lyrics Spotify",
    };
  }
}
