import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.test.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./test.db",
  },
});
