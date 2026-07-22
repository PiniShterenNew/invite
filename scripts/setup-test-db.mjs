// Creates a clean SQLite file for the test suite and pushes the current
// Prisma schema to it. Runs before `npm test` (see package.json "pretest").
import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbPath = path.join(process.cwd(), "prisma", "test.db");
for (const f of [dbPath, `${dbPath}-journal`]) {
  if (existsSync(f)) unlinkSync(f);
}

execSync("node scripts/prepare-sqlite-schema.mjs", { stdio: "inherit" });
execSync("npx prisma generate --config prisma.test.config.ts", { stdio: "inherit" });

const migrationPath = path.join(
  process.cwd(),
  "prisma",
  "migrations",
  "20260719174455_init",
  "migration.sql",
);
const sqliteSql = readFileSync(migrationPath, "utf8").replaceAll("TIMESTAMP(3)", "DATETIME");
const database = new Database(dbPath);
database.pragma("foreign_keys = ON");
database.exec(sqliteSql);
database.close();
