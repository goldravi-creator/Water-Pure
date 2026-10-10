import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
//  Database URL resolution
//
//  The app supports two engines:
//    • SQLite  (local dev, zero-setup)          -> URL starts with "file:"
//    • PostgreSQL (production, e.g. on Vercel)  -> URL starts with "postgres://"
//
//  This helper keeps things resilient:
//    - Strips stray quotes/whitespace that can sneak in from .env edits.
//    - Resolves relative SQLite paths to absolute "file:" URLs so the app works
//      no matter which directory it is started from.
//    - Honours a real database URL (postgres://, mysql://, ...) untouched.
//    - If the URL is missing/empty/bare and the target is SQLite (the default),
//      falls back to the bundled SQLite file instead of crashing every query with:
//         Error validating datasource `db`: the URL must start with the protocol `file:`.
// ---------------------------------------------------------------------------
function resolveDatabaseUrl(): string {
  const raw = (process.env.DATABASE_URL || "").trim().replace(/^["']|["']$/g, "");
  const provider = (process.env.DATABASE_PROVIDER || "sqlite").toLowerCase();

  const bases = [path.join(process.cwd(), "prisma"), process.cwd()];
  const asFileUrl = (p: string) => "file:" + p.replace(/\\/g, "/");

  // 1. SQLite file: URL -> normalise to an absolute path.
  if (raw.startsWith("file:")) {
    const rest = raw.slice("file:".length);
    if (path.isAbsolute(rest) || /^[a-zA-Z]:[\\/]/.test(rest)) {
      return asFileUrl(rest);
    }
    const rel = rest.replace(/^[./\\]+/, "");
    for (const base of bases) {
      const candidate = path.join(base, rel);
      if (fs.existsSync(candidate)) return asFileUrl(candidate);
    }
    return asFileUrl(path.join(bases[0], rel));
  }

  // 2. A real network database URL (postgres://, postgresql://, mysql://, ...).
  //    Pass it through untouched — this is how production runs.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    return raw;
  }

  // 3. Anything else is unusable. Only override when the target is SQLite;
  //    for other providers let Prisma surface the real configuration error.
  if (provider !== "sqlite") {
    return raw;
  }

  if (raw) {
    console.warn(
      `[db] DATABASE_URL is not a valid SQLite "file:" URL (got "${raw}"). ` +
        `Falling back to the bundled SQLite database so the app keeps working. ` +
        `For local development set DATABASE_URL="file:./dev.db".`
    );
  }

  const fallback =
    bases.map((b) => path.join(b, "dev.db")).find((p) => fs.existsSync(p)) ??
    path.join(bases[0], "dev.db");
  return asFileUrl(fallback);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
