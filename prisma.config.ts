import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For local dev with `prisma migrate`, this allows reading from .env
    // In Docker, ENV vars override this anyway for the client.
    url: process.env["DATABASE_URL"] ?? "",
  },
});
