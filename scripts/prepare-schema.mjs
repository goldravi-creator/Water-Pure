// ---------------------------------------------------------------------------
//  prepare-schema.mjs
//
//  Prisma does not allow `provider = env(...)`, so this tiny pre-step rewrites
//  the datasource provider in prisma/schema.prisma.
//
//  Provider selection:
//    • DATABASE_PROVIDER set      -> that value wins (sqlite|postgresql|mysql)
//    • else on Vercel (VERCEL=1)  -> "postgresql"  (auto-detected, zero config)
//    • else (local dev)           -> "sqlite"      (zero-setup)
//
//  It runs automatically before `prisma generate` (postinstall) and before
//  `next build`, so the correct client is always generated for the target.
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const supported = ["sqlite", "postgresql", "mysql"];
// An explicit DATABASE_PROVIDER always wins. Otherwise we auto-detect: on Vercel
// (process.env.VERCEL is set automatically during build & runtime) use PostgreSQL,
// everywhere else use zero-setup SQLite.
const explicit = process.env.DATABASE_PROVIDER;
const onVercel = Boolean(process.env.VERCEL);
const provider = (explicit || (onVercel ? "postgresql" : "sqlite")).toLowerCase();
const source = explicit ? "DATABASE_PROVIDER" : onVercel ? "VERCEL auto-detect" : "default(local)";

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
  console.log(`[prepare-schema] datasource provider set to "${provider}" (${source})`);
} else {
  console.log(`[prepare-schema] datasource provider already "${provider}" (${source})`);
}
