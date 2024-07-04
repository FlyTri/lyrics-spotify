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
   * @param {string} id
   */
  async getLyrics(id) {
    if (!this.client.topology) return;

    const data = await this.collection.findOne({ id }).catch(() => null);

    if (data)
      return {
        ...data.lyrics,
        source: "Cung cấp bởi kho lưu trữ của Lyrics Spotify",
      };
  }
}
