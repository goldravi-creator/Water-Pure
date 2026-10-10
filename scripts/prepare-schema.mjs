// ---------------------------------------------------------------------------
//  prepare-schema.mjs
//
//  Prisma does not allow `provider = env(...)`, so this tiny pre-step rewrites
//  the datasource provider in prisma/schema.prisma based on the
//  DATABASE_PROVIDER environment variable.
//
//    • Local dev / default : DATABASE_PROVIDER unset  -> "sqlite"  (zero-setup)
//    • Vercel / production : DATABASE_PROVIDER=postgresql -> "postgresql"
//
//  It runs automatically before `prisma generate` (postinstall) and before
//  `next build`, so the correct client is always generated for the target.
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const supported = ["sqlite", "postgresql", "mysql"];
const provider = (process.env.DATABASE_PROVIDER || "sqlite").toLowerCase();

if (!supported.includes(provider)) {
  console.error(
    `[prepare-schema] Invalid DATABASE_PROVIDER "${provider}". ` +
      `Expected one of: ${supported.join(", ")}.`
  );
  process.exit(1);
}

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "..", "prisma", "schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

// Only the datasource provider uses one of these values; the generator uses
// "prisma-client-js", so this regex cannot clobber it.
const next = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql|mysql)"/,
  `provider = "${provider}"`
);

if (next !== schema) {
  writeFileSync(schemaPath, next);
  console.log(`[prepare-schema] datasource provider set to "${provider}"`);
} else {
  console.log(`[prepare-schema] datasource provider already "${provider}"`);
}
