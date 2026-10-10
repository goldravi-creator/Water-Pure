import { CheckCircle2 } from "lucide-react";
import { LinkButton, SectionTitle } from "@/components/ui";

const PLANS = [
  {
    name: "Basic",
    price: "₹1,999",
    period: "/ year",
    features: ["2 preventive service visits", "Sediment + carbon filters", "Free phone support", "Basic TDS check"],
  },
  {
    name: "Standard",
    price: "₹3,499",
    period: "/ year",
    highlight: true,
    features: ["4 preventive service visits", "All filters included", "Priority scheduling", "10% off spare parts", "Free water testing"],
  },
  {
    name: "Premium",
    price: "₹5,999",
    period: "/ year",
    features: ["Unlimited service visits", "All filters + RO membrane", "24×7 priority support", "20% off spare parts", "Annual deep cleaning"],
  },
];

const FAQ = [
  ["How often should I service my RO?", "Every 3–4 months for filters and once a year for a full service. Our AMC plans automate these reminders."],
  ["Do you service all brands?", "Yes — we service all major domestic and commercial RO brands using genuine or equivalent spares."],
  ["What is included in the visit charge?", "Diagnosis and repair labour. Parts are billed separately with your approval."],
  ["Can I reschedule a booking?", "Absolutely. Login to the customer portal or tell our AI assistant and we'll reschedule instantly."],
];

export default function PricingPage() {
  return (
    <div className="container-page py-14">
      <SectionTitle
        title="Pricing & AMC Plans"
        description="Transparent pricing. No hidden charges."
        right={<LinkButton href="/book">Get a quote</LinkButton>}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`card-surface flex flex-col p-6 ${p.highlight ? "ring-2 ring-brand-500" : ""}`}
          >
            {p.highlight ? (
              <span className="mb-2 inline-block w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600">
                Best value
              </span>
            ) : null}
            <h3 className="text-lg font-bold text-slate-800">{p.name} AMC</h3>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-3xl font-extrabold text-brand-600">{p.price}</span>
              <span className="text-sm text-slate-500">{p.period}</span>
            </div>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-600">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <LinkButton
              href="/book"
              className="mt-6 w-full"
              variant={p.highlight ? "primary" : "outline"}
            >
              Choose {p.name}
            </LinkButton>
          </div>
        ))}
      </div>

      <h2 className="mt-16 text-xl font-bold text-slate-800">Frequently asked questions</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {FAQ.map(([q, a]) => (
          <div key={q} className="card-surface p-5">
            <h3 className="text-sm font-semibold text-slate-800">{q}</h3>
            <p className="mt-1.5 text-sm text-slate-500">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
