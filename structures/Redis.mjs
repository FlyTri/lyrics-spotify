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

      this.client.on("ready", () =>
        console.log("Successfully reconnected to Redis database")
      );
    });

    this.client.on("error", (error) => {
      console.log(`Redis error: ${error}`);
    });
  }
  async set(key, value) {
    if (!this.client.isReady || true) return;

    return this.client.set(key, 43200, JSON.stringify(value)); //.catch(() => null);
  }
  async get(key) {
    if (!this.client.isReady || true) return;

    return this.client.get(key).then(JSON.parse); //.catch(() => null);
  }
}
