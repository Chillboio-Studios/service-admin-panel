import { Document, MongoClient } from "mongodb";
import { Database, Err, database, init } from "revolt-nodejs-bindings";

import { ensureCollection, ensureAllCollections } from "./ensureCollections";

/**
 * Global handle to Mongo shared in process
 */
let client: MongoClient;

/**
 * Global handle to binding database shared in process
 */
let bindDatabase: Database;

/**
 * Fetch handle to MongoDB client
 * @returns Mongo client
 */
function mongoClient() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB!);
  }

  return client;
}

/**
 * Fetch handle to binding database
 * @returns database
 */
export function revoltDb() {
  if (!bindDatabase) {
    bindDatabase = database();
  }

  return bindDatabase;
}

/**
 * Call a procedure from the Revolt backend
 */
export async function callProcedure<A extends any[], R>(
  fn: (...args: A) => R,
  ...args: A
): Promise<R> {
  await init();
  const result = await fn.bind(revoltDb())(...args);
  if ((result as { error?: Err }).error)
    throw new Error(
      (result as { error: Err }).error.type +
        " in " +
        (result as { error: Err }).error.location,
    );
  return result;
}

/**
 * Ensure all known databases and collections exist.
 * Call once at application startup.
 */
export async function initializeDatabase(): Promise<void> {
  await ensureAllCollections(mongoClient());
}

/**
 * Create a collection handle generator for given parameters.
 * Automatically ensures the database and collection exist on first access.
 * @param db Database Name
 * @param col Collection Name
 * @returns Factory
 */
export function createCollectionFn<T extends Document>(
  db: string,
  col: string,
) {
  let ensured = false;
  return () => {
    const client = mongoClient();
    if (!ensured) {
      ensured = true;
      // Fire-and-forget: ensure collection exists in the background
      ensureCollection(client, db, col).catch(() => {});
    }
    return client.db(db).collection<T>(col);
  };
}

export * from "./hr";
