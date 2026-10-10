import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Wrench,
  Droplets,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Star,
  BadgeCheck,
  Timer,
} from "lucide-react";
import { LinkButton, SectionTitle } from "@/components/ui";
import { BookingForm } from "@/components/site/booking-form";

const SERVICES = [
  {
    icon: Droplets,
    title: "New RO Installation",
    desc: "Expert installation of domestic & commercial RO purifiers with a free water-quality check.",
  },
  {
    icon: ShieldCheck,
    title: "AMC / Service Plans",
    desc: "Annual maintenance with scheduled filter changes, cleaning and priority support.",
  },
  {
    icon: Wrench,
    title: "Repair & Parts",
    desc: "Fast diagnosis and repair of motors, membranes, filters, and all major brands.",
  },
  {
    icon: Timer,
    title: "Water Testing",
    desc: "Lab-grade TDS and contamination testing with a personalised treatment recommendation.",
  },
];

const STEPS = [
  { title: "Request a service", desc: "Book online or via our AI chat in under a minute." },
  { title: "AI calls you back", desc: "Our AI assistant qualifies your need and books a slot instantly." },
  { title: "Technician visits", desc: "A verified technician reaches you at the scheduled time." },
  { title: "Enjoy pure water", desc: "Service logged, invoice sent, and reminders automated." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-aqua-500 text-white">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs font-medium">
              <Sparkles size={14} /> AI-managed RO service — from lead to pure water
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
              Pure water at home,<br />without the wait.
            </h1>
            <p className="mt-4 max-w-md text-base text-white/90">
              RO installation, servicing and AMC by verified technicians. Book in
              seconds — our AI assistant handles the rest and keeps your water pure.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/book" size="lg" variant="success">
                Book a Service
              </LinkButton>
              <a
                href={`tel:${process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91-90000-00000"}`}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/40 px-6 text-base font-medium hover:bg-white/10"
              >
                <PhoneCall size={18} /> Call now
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/90">
              <span className="flex items-center gap-2"><BadgeCheck size={16}/> Verified technicians</span>
              <span className="flex items-center gap-2"><Clock size={16}/> Same-day service</span>
              <span className="flex items-center gap-2"><Star size={16}/> 4.8★ rated</span>
            </div>
          </div>

          <div>
            <div className="rounded-2xl bg-white/[0.07] p-1.5 backdrop-blur">
              <div className="rounded-xl bg-white p-5 text-slate-800 shadow-2xl">
                <h3 className="text-sm font-bold text-slate-800">
                  Book a service in 30 seconds
                </h3>
                <p className="mb-4 text-xs text-slate-500">
                  Our AI assistant will call you back to confirm.
                </p>
                <BookingForm compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
          {[
            ["25,000+", "Homes served"],
            ["60+", "Expert technicians"],
            ["4.8★", "Average rating"],
            ["< 24 hrs", "Response time"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-extrabold text-brand-600">{v}</div>
              <div className="text-xs text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="container-page py-16">
        <SectionTitle
          title="Everything your RO needs"
          description="One team for installation, service, repair and water testing."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card-surface p-6 transition hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-800">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="container-page">
          <h2 className="text-2xl font-bold">How it works</h2>
          <p className="mt-1 text-slate-400">
            Automated end-to-end so you never chase a service again.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans teaser */}
      <section className="container-page py-16">
        <SectionTitle
          title="Simple AMC plans"
          description="Regular servicing keeps your water safe and your purifier lasting longer."
          right={<LinkButton href="/pricing" variant="outline" size="sm">See full pricing</LinkButton>}
        />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { name: "Basic", price: "₹1,999/yr", features: ["2 service visits", "Sediment + carbon filters", "Free phone support"] },
            { name: "Standard", price: "₹3,499/yr", features: ["4 service visits", "All filters included", "Priority scheduling", "10% parts discount"], highlight: true },
            { name: "Premium", price: "₹5,999/yr", features: ["Unlimited visits", "All filters + membrane", "24×7 support", "20% parts discount"] },
          ].map((p) => (
            <div
              key={p.name}
              className={`card-surface p-6 ${p.highlight ? "ring-2 ring-brand-500" : ""}`}
            >
              {p.highlight ? (
                <span className="mb-2 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
                  Most popular
                </span>
              ) : null}
              <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
              <div className="mt-1 text-3xl font-extrabold text-brand-600">{p.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <LinkButton href="/book" className="mt-6 w-full" variant={p.highlight ? "primary" : "outline"}>
                Choose {p.name}
              </LinkButton>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-aqua-500 px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold">Water not tasting right? We&apos;re one call away.</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Book a free water-quality check and get a same-day service slot.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <LinkButton href="/book" size="lg" variant="success">Book a Service</LinkButton>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-lg border border-white/40 px-6 font-medium hover:bg-white/10"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
