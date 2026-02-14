import { MongoClient } from "mongodb";

/**
 * Registry of all known databases and their collections.
 * When the app accesses a collection, it will be auto-created if missing.
 */
const KNOWN_COLLECTIONS: Record<string, string[]> = {
  revolt: [
    "accounts",
    "bots",
    "channels",
    "channel_invites",
    "messages",
    "safety_cases",
    "safety_reports",
    "safety_snapshots",
    "server_members",
    "servers",
    "sessions",
    "users",
    "safety_strikes",
  ],
  revolt_admin: ["changelog", "discover_requests"],
  revolt_hr: ["people", "positions", "roles"],
  analytics: ["servers", "bots"],
};

/** Track which db/collection pairs have already been verified this process */
const verified = new Set<string>();

/**
 * Ensure a specific database and collection exist.
 * Only checks once per process lifetime per db/collection pair.
 */
export async function ensureCollection(
  client: MongoClient,
  dbName: string,
  colName: string,
): Promise<void> {
  const key = `${dbName}/${colName}`;
  if (verified.has(key)) return;

  try {
    const db = client.db(dbName);
    const collections = await db
      .listCollections({ name: colName }, { nameOnly: true })
      .toArray();

    if (collections.length === 0) {
      await db.createCollection(colName);
      console.log(`[DB] Created collection: ${dbName}.${colName}`);
    }

    verified.add(key);
  } catch (error) {
    // If we get an error (e.g. collection was created concurrently), just mark as verified
    console.warn(
      `[DB] Warning while ensuring ${dbName}.${colName}:`,
      (error as Error).message,
    );
    verified.add(key);
  }
}

/**
 * Ensure all known databases and collections exist.
 * Call this once at startup to bootstrap the full schema.
 */
export async function ensureAllCollections(
  client: MongoClient,
): Promise<void> {
  for (const [dbName, collections] of Object.entries(KNOWN_COLLECTIONS)) {
    for (const colName of collections) {
      await ensureCollection(client, dbName, colName);
    }
  }
}

/**
 * Register a new db/collection pair in the known registry.
 * Useful for dynamically added collections.
 */
export function registerCollection(dbName: string, colName: string): void {
  if (!KNOWN_COLLECTIONS[dbName]) {
    KNOWN_COLLECTIONS[dbName] = [];
  }
  if (!KNOWN_COLLECTIONS[dbName].includes(colName)) {
    KNOWN_COLLECTIONS[dbName].push(colName);
  }
}
