import mongoose from "mongoose";
import { getMongoUri } from "@/shared/hooks/servenEnv";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};
global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log("[MongoDB] Using cached connection");
    return cached.conn;
  }

  const MONGODB_URI = getMongoUri();

  if (!cached.promise) {
    console.log("[MongoDB] Connecting to database...");
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((mongooseInstance) => {
        const { host, port, name } = mongooseInstance.connection;
        console.log(
          `[MongoDB] ✓ Connected — host: ${host}:${port}, db: ${name}`
        );
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("[MongoDB] ✗ Connection failed:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
