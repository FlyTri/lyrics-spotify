import { createClient } from "redis";

export default class Redis {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: () => 5000 },
    });

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
      console.log(`Redis error: ${error.message}`);
    });
  }
  async set(key, value, time = 43200) {
    if (!this.client.isReady) return;

    return this.client
      .setEx(key, time, JSON.stringify(value))
      .catch(() => null);
  }
  async get(key) {
    if (!this.client.isReady) return;

    return this.client
      .get(key)
      .then((f) => {
        if (f) {
          console.log(`get ${key} from `);
          return JSON.parse(f);
        }
      })
      .catch(() => null);
  }
}
