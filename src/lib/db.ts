import { PrismaClient } from "@/generated/prisma/client";
import { PrismaClient as PrismaSqliteClient } from "@/generated/prisma-sqlite/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    return new PrismaSqliteClient({ adapter: new PrismaBetterSqlite3({ url }) }) as unknown as PrismaClient;
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
