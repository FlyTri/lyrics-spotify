import { createClient } from "redis";

export default class Redis {
  constructor() {
    this.client = createClient({ url: process.env.REDIS_URL });

    const date = Date.now();
    this.client.connect().then(() => {
      console.log(
        `Successfully connected to Redis database\n> Took ${
          Date.now() - date
        }ms`
      );

      this.client.on("error", (error) => {
        console.log(`Redis error: ${error}`);
      }).on("ready", () => console.log("Successfully reconnected to Redis database"));
    });
  }
  async set(key, value) {
    return this.client.setEx(key, 43200, value).catch(() => null);
  }
  async get(key) {
    return this.client.get(key).catch(() => null);
  }
}
