import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const sourceSchema = path.join(process.cwd(), "prisma", "schema.prisma");
const testSchema = path.join(process.cwd(), "prisma", "schema.test.prisma");

const sqliteSchema = readFileSync(sourceSchema, "utf8")
  .replace('output   = "../src/generated/prisma"', 'output   = "../src/generated/prisma-sqlite"')
  .replace('provider = "postgresql"', 'provider = "sqlite"');

writeFileSync(testSchema, sqliteSchema, "utf8");
