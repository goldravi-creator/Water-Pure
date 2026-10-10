// =====================================================================
//  Seed CLI — run:  npm run db:seed   (or: npx tsx prisma/seed.ts)
//  The actual data lives in src/lib/seed.ts so the same routine can also
//  be triggered from the protected /api/admin/seed route on Vercel.
// =====================================================================
import { runSeed } from "../src/lib/seed";
import { prisma } from "../src/lib/db";

runSeed()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
