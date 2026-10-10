// =====================================================================
//  Seed data — demo data for the WaterPure RO CRM.
//
//  Exposed as a reusable function so it can run from:
//    • the CLI           -> prisma/seed.ts  (npm run db:seed)
//    • a protected route -> /api/admin/seed (used once on Vercel)
// =====================================================================
import { prisma } from "./db";
import { runAiCall } from "./ai/agent";

export type SeedOptions = {
  /** How many simulated AI calls to generate (default 36). */
  aiCalls?: number;
};

export type SeedResult = {
  users: number;
  leads: number;
  calls: number;
  tickets: number;
  customers: number;
};

export async function runSeed(opts: SeedOptions = {}): Promise<SeedResult> {
  const aiCallCount = Math.max(0, Math.min(36, opts.aiCalls ?? 36));
  console.log("🌊 Seeding RO Water CRM…");

  // ---- wipe (order matters for FK integrity) ----
  await prisma.payment.deleteMany();
  await prisma.serviceJob.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.call.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.knowledgeDoc.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.webhookEvent.deleteMany();

  // ---- users ----
  const [owner, , , agent1, agent2, tech] = await Promise.all([
    prisma.user.create({ data: { name: "Anil Verma", email: "owner@waterpure.example", passwordHash: await bcryptHash("owner123"), role: "OWNER", phone: "+919800000001" } }),
    prisma.user.create({ data: { name: "Priya Kapoor", email: "manager@waterpure.example", passwordHash: await bcryptHash("manager123"), role: "MANAGER", phone: "+919800000002" } }),
    prisma.user.create({ data: { name: "Ravi Patel", email: "lead@waterpure.example", passwordHash: await bcryptHash("lead123"), role: "TEAM_LEAD", phone: "+919800000003" } }),
    prisma.user.create({ data: { name: "Sneha Joshi", email: "agent@waterpure.example", passwordHash: await bcryptHash("agent123"), role: "AGENT", phone: "+919800000004" } }),
    prisma.user.create({ data: { name: "Karan Mehta", email: "agent2@waterpure.example", passwordHash: await bcryptHash("agent123"), role: "AGENT", phone: "+919800000005" } }),
    prisma.user.create({ data: { name: "Vikram Singh", email: "tech@waterpure.example", passwordHash: await bcryptHash("tech123"), role: "TECHNICIAN", phone: "+919800000006" } }),
    prisma.user.create({ data: { name: "Neha Gupta", email: "accounts@waterpure.example", passwordHash: await bcryptHash("acc123"), role: "ACCOUNTANT", phone: "+919800000007" } }),
  ]);

  // ---- knowledge base (RAG-lite) ----
  await prisma.knowledgeDoc.createMany({
    data: [
      { title: "AMC Pricing", content: "AMC plans: Basic ₹1,999/yr (2 visits), Standard ₹3,499/yr (4 visits, all filters), Premium ₹5,999/yr (unlimited visits, all filters + RO membrane).", tags: "amc price cost plan" },
      { title: "Installation Pricing", content: "New RO installation starts at ₹8,999 for 7-stage domestic purifiers. Commercial systems quoted on request. Includes survey, plumbing and 1-year warranty.", tags: "install new ro price cost" },
      { title: "Repair & Visit Charge", content: "Service visit charge ₹499 (labour + diagnosis). Parts billed separately with customer approval. Same-day slots available in most areas.", tags: "repair visit charge price" },
      { title: "Service Areas", content: "We currently cover Lucknow, Delhi NCR, Noida, Jaipur, Indore and nearby metro areas. On-site availability confirmed by area.", tags: "area city location coverage" },
      { title: "AMC Includes", content: "AMC includes preventive visits, genuine filter replacements, cleaning, sanitization and priority scheduling.", tags: "amc includes filter clean" },
      { title: "Water Testing", content: "Free water-quality (TDS) test with every service booking. Lab-grade contamination testing in ₹299.", tags: "test tds quality water" },
    ],
  });

  // ---- campaigns ----
  const coldCamp = await prisma.campaign.create({
    data: { name: "Lucknow cold DB — Round 3", channel: "OUTBOUND", status: "ACTIVE", dailyLimit: 300, script: "Focus on AMC for purifiers older than 18 months." },
  });
  const gmcCamp = await prisma.campaign.create({
    data: { name: "Google Ads — 'RO service near me'", channel: "GOOGLE_ADS", status: "ACTIVE", dailyLimit: 100 },
  });
  const metaCamp = await prisma.campaign.create({
    data: { name: "Meta Lead Ads — New RO offer", channel: "META_ADS", status: "ACTIVE", dailyLimit: 150 },
  });

  // ---- leads ----
  const firstNames = ["Rahul", "Priya", "Amit", "Sneha", "Vikas", "Kiran", "Manoj", "Neha", "Sanjay", "Pooja", "Arjun", "Ritika", "Deepak", "Anjali", "Mohit", "Kavita", "Rajesh", "Tanvi", "Gaurav", "Shreya", "Nitin", "Ayesha", "Suresh", "Divya"];
  const lastNames = ["Sharma", "Verma", "Singh", "Gupta", "Mehta", "Joshi", "Patel", "Yadav", "Khan", "Reddy", "Das", "Bose", "Nair", "Chopra", "Mishra", "Kulkarni"];
  const cities: Array<[string, string[]]> = [
    ["Lucknow", ["Gomti Nagar", "Indira Nagar", "Alambagh", "Hazratganj"]],
    ["Delhi", ["Rajouri Garden", "Dwarka", "Janakpuri", "Rohini"]],
    ["Noida", ["Sector 62", "Sector 18", "Greater Noida West"]],
    ["Jaipur", ["Malviya Nagar", "Vaishali Nagar", "C-Scheme"]],
  ];
  const intents = ["NEW_INSTALL", "AMC", "REPAIR", "FILTER_PARTS", "WATER_TEST"];
  const sources: Array<{ s: string; c: string | null }> = [
    { s: "COLD_UPLOAD", c: coldCamp.id },
    { s: "GOOGLE_ADS", c: gmcCamp.id },
    { s: "META_ADS", c: metaCamp.id },
    { s: "WEBSITE", c: null },
    { s: "WHATSAPP", c: null },
    { s: "MISSED_CALL", c: null },
    { s: "REFERRAL", c: null },
  ];

  const leadRows: Array<{ name: string; phone: string; city: string; area: string; language: string; source: string; campaignId: string | null; intent: (typeof intents)[number]; dnd: boolean; isCustomer: boolean }> = [];
  for (let i = 0; i < 60; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    const [city, areas] = cities[i % cities.length];
    const area = areas[i % areas.length];
    const src = sources[i % sources.length];
    const phone = i < 3 ? `+9197${String(9000000 + i * 11111).slice(0, 8)}` : `+9197${String(10000000 + i * 137913).slice(-8)}`;
    leadRows.push({
      name: `${fn} ${ln}`,
      phone,
      city,
      area,
      language: i % 4 === 0 ? "en" : "hi",
      source: src.s,
      campaignId: src.c,
      intent: intents[(i * 3) % intents.length],
      dnd: i % 11 === 0,
      isCustomer: false,
    });
  }

  // Portal demo customer (also in the lead list)
  leadRows.push({
    name: "Rajiv Malhotra",
    phone: "+919876543210",
    city: "Lucknow",
    area: "Gomti Nagar",
    language: "hi",
    source: "WEBSITE",
    campaignId: null,
    intent: "AMC",
    dnd: false,
    isCustomer: true,
  });

  const createdLeads = [];
  for (let i = 0; i < leadRows.length; i++) {
    const l = leadRows[i];
    const lead = await prisma.lead.create({
      data: {
        name: l.name,
        phone: l.phone,
        city: l.city,
        area: l.area,
        language: l.language,
        source: l.source,
        campaignId: l.campaignId,
        intent: l.intent,
        dnd: l.dnd,
        isCustomer: l.isCustomer,
        status: "NEW",
        consent: !l.dnd,
        bestTime: ["Morning", "Afternoon", "Evening"][i % 3],
        assignedToId: i % 2 === 0 ? agent1.id : agent2.id,
        ownerId: owner.id,
        notes: l.dnd ? "Registered DND — verify consent before contacting" : null,
      },
    });
    createdLeads.push(lead);
  }

  console.log(`✅ ${createdLeads.length} leads created`);

  // ---- AI cold calling on a realistic subset (transcripts, tickets) ----
  const toCall = createdLeads.filter((l) => !l.dnd).slice(0, aiCallCount);
  let callsMade = 0;
  let handoffs = 0;
  for (const lead of toCall) {
    try {
      const res = await runAiCall(lead.id);
      if (!res.skipped) callsMade++;
      if (res.analysis?.humanRequested) handoffs++;
    } catch {
      // ignore individual failures
    }
  }
  console.log(`📞 ${callsMade} AI calls simulated · ${handoffs} human hand-offs`);

  // ---- convert a few qualified leads into customers with bookings ----
  const qualified = await prisma.lead.findMany({ where: { status: "QUALIFIED" }, take: 6 });
  for (let i = 0; i < qualified.length; i++) {
    const q = qualified[i];
    await prisma.serviceJob.create({
      data: {
        leadId: q.id,
        customerId: q.id,
        type: q.intent || "AMC",
        status: i === 0 ? "COMPLETED" : "SCHEDULED",
        scheduledAt: new Date(Date.now() + (i + 1) * 2 * 86400000),
        address: [q.area, q.city].filter(Boolean).join(", "),
        amount: q.intent === "NEW_INSTALL" ? 12000 : q.intent === "AMC" ? 4500 : 1200,
        technicianId: tech.id,
      },
    });
    await prisma.lead.update({
      where: { id: q.id },
      data: { status: i === 0 ? "CONVERTED" : "INTERESTED", isCustomer: true },
    });
  }

  // Portal demo customer service history
  const portalLead = await prisma.lead.findUnique({ where: { phone: "+919876543210" } });
  if (portalLead) {
    await prisma.lead.update({ where: { id: portalLead.id }, data: { status: "CONVERTED", isCustomer: true, score: 88 } });
    await prisma.serviceJob.create({
      data: { leadId: portalLead.id, customerId: portalLead.id, type: "AMC", status: "COMPLETED", scheduledAt: new Date(Date.now() - 20 * 86400000), address: "B-14, Gomti Nagar, Lucknow", amount: 3499, technicianId: tech.id },
    });
    await prisma.serviceJob.create({
      data: { leadId: portalLead.id, customerId: portalLead.id, type: "AMC", status: "SCHEDULED", scheduledAt: new Date(Date.now() + 3 * 86400000), address: "B-14, Gomti Nagar, Lucknow", amount: 3499, technicianId: tech.id },
    });
  }

  const finalStats: SeedResult = {
    users: await prisma.user.count(),
    leads: await prisma.lead.count(),
    calls: await prisma.call.count(),
    tickets: await prisma.ticket.count(),
    customers: await prisma.lead.count({ where: { isCustomer: true } }),
  };

  console.log("🌊 Seed complete!", finalStats);
  console.log("\nLogin: owner@waterpure.example / owner123");
  console.log("      manager@waterpure.example / manager123");
  console.log("      agent@waterpure.example / agent123");
  console.log("Portal (OTP demo): +919876543210 — any 6-digit OTP works in dev mode.\n");

  return finalStats;
}

// Small local helper so this module has no build-time dependency on bcryptjs types.
async function bcryptHash(plain: string): Promise<string> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(plain, 10);
}
