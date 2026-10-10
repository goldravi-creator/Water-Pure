// =====================================================================
//  Bootstrap — create temporary safety around the demo database.
//
//  Runs during `next build` (and any fresh `npm run build`):
//    1. If the database has no leads, it is a pristine/empty DB and gets
//       seeded with the demo data (script exits 0 even if seeding hiccups,
//       so a failed seed never blocks the deployment — tables still exist).
//    2. If the database already has data, seeding is SKIPPED so user data
//       is never wiped on a redeploy.
//
//  (Table creation happens via `prisma db push` in the build script.)
// =====================================================================
import { prisma } from "../src/lib/db";
import { runSeed } from "../src/lib/seed";

async function main() {
  let leadCount: number;
  try {
    leadCount = await prisma.lead.count();
  } catch (e) {
    // Tables likely missing — report clearly but do not crash the build.
    console.error(
      `[bootstrap] Could not inspect the database (${(e as Error).message}). ` +
        `Assuming tables will be created by "prisma db push".`
    );
    await prisma.$disconnect();
    return;
  }

  if (leadCount > 0) {
    console.log(`[bootstrap] Database already has ${leadCount} leads — skipping seed.`);
  } else {
    console.log("[bootstrap] Database is empty — seeding demo data…");
    try {
      await runSeed();
      console.log("[bootstrap] Seed complete.");
    } catch (e) {
      console.warn(`[bootstrap] Seeding failed (${(e as Error).message}) — continuing anyway.`);
    }
  }

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(0);
  });