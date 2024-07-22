import { commandOptions, createClient } from "redis";
import { compressSync, uncompressSync } from "snappy";

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
      .setEx(key, time, compressSync(JSON.stringify(value)))
      .catch(() => null);
  }
  async get(key) {
    
    if (!this.client.isReady) return;

    const data = await this.client
      .get(commandOptions({ returnBuffers: true }), key)
      .catch(() => null);

    if (data) {
      const uncompressed = JSON.parse(uncompressSync(data));

      if (uncompressed.source)
        return { ...uncompressed, source: `${uncompressed.source} (Cached)` };

      return uncompressed;
    }
  }
}
