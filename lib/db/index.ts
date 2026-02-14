import { readFileSync } from "fs";
import { Document, MongoClient } from "mongodb";
import { resolve } from "path";

import { ensureCollection } from "../database/ensureCollections";

/**
 * Global handle shared in process
 */
let client: MongoClient;

/**
 * Fetch handle to MongoDB client
 * @returns Mongo client
 */
function mongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB!);
  }

  return client;
}

/**
 * Fetch handle to MongoDB database
 * @param name Database name
 * @returns Database handle
 */
export function db(name: string = "revolt") {
  return mongo().db(name);
}

/** Track which collections have been auto-ensured via the legacy layer */
const ensuredLegacy = new Set<string>();

/**
 * Fetch handle to MongoDB collection.
 * Uses the `revolt` database by default.
 * Automatically ensures the collection exists on first access.
 * @param name Collection name
 * @param dbName Database name (defaults to "revolt")
 * @returns Collection handle
 */
export function col<T extends Document>(name: string, dbName: string = "revolt") {
  const key = `${dbName}/${name}`;
  if (!ensuredLegacy.has(key)) {
    ensuredLegacy.add(key);
    ensureCollection(mongo(), dbName, name).catch(() => {});
  }
  return db(dbName).collection<T>(name);
}

export default mongo;
