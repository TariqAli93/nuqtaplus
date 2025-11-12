import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname as pathDirname } from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import * as schema from './models/index.js';

// Ensure data directory exists
const dbPath = config.database.path;
const dbDir = pathDirname(dbPath);
mkdirSync(dbDir, { recursive: true });

// Initialize SQLite database with sql.js
let saveDatabaseFn;
let closeDatabaseFn;

async function initDB() {
  const SQL = await initSqlJs();

  let buffer;
  if (existsSync(dbPath)) {
    buffer = readFileSync(dbPath);
  }

  const sqlite = new SQL.Database(buffer);

  // Enable foreign keys
  sqlite.run('PRAGMA foreign_keys = ON');

  // Save database function
  const saveDatabase = () => {
    const data = sqlite.export();
    writeFileSync(dbPath, data);
  };

  // Close database function
  const closeDatabase = () => {
    sqlite.close();
  };

  // Store the close function for export
  closeDatabaseFn = closeDatabase;

  // Store the save function for export
  saveDatabaseFn = saveDatabase;

  // Auto-save on changes
  process.on('exit', saveDatabase);
  process.on('SIGINT', () => {
    saveDatabase();
    process.exit(0);
  });

  // Create Drizzle instance
  const db = drizzle(sqlite, { schema });

  // Run pending migrations (ensure tables exist)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = pathDirname(__filename);
  const migrationsFolder = join(__dirname, '../drizzle');
  await migrate(db, { migrationsFolder });

  // Persist DB to disk after migrations
  saveDatabase();

  return db;
}

// Export async initialized db
export const db = await initDB();

export const saveDatabase = () => {
  if (saveDatabaseFn) {
    saveDatabaseFn();
  }
};

export default db;
