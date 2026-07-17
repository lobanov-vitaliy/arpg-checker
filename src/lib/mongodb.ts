import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");
const mongoUri = uri;

// Serverless-friendly options: keep each lambda's pool small so a burst of
// concurrent instances doesn't exhaust the shared-tier cluster's connection
// limit, and fail fast (~8-10s) instead of hanging ~100s on a connectivity blip.
const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 10000,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Never cache a rejected connect promise: if the initial connect fails, drop it
// so the next request establishes a fresh connection instead of a warm lambda
// replaying the same failure forever (which served fast 500s across all routes).
function connect(): Promise<MongoClient> {
  const promise = new MongoClient(mongoUri, options).connect();
  promise.catch(() => {
    if (global._mongoClientPromise === promise) global._mongoClientPromise = undefined;
  });
  return promise;
}

export async function getDb(): Promise<Db> {
  if (!global._mongoClientPromise) global._mongoClientPromise = connect();
  const client = await global._mongoClientPromise;
  return client.db("seasonpulse");
}
