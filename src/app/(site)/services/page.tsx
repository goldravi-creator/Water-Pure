import {
  Droplets,
  ShieldCheck,
  Wrench,
  Timer,
  Search,
  Repeat,
  CheckCircle2,
} from "lucide-react";
import { SectionTitle, LinkButton } from "@/components/ui";

const SERVICES = [
  {
    icon: Droplets,
    title: "New RO Installation",
    price: "From ₹8,999",
    desc: "Complete supply and installation of domestic RO purifiers (7–10 stage). Includes free TDS test and 1-year on-site warranty.",
    points: ["Site & water-quality survey", "Professional plumbing & fitting", "Demo + usage training", "1-year free service"],
  },
  {
    icon: ShieldCheck,
    title: "AMC / Annual Maintenance",
    price: "From ₹1,999/yr",
    desc: "Keep your purifier healthy with scheduled visits, filter replacements and priority support all year.",
    points: ["Scheduled service visits", "Genuine filters included", "Priority response", "Discounted spare parts"],
  },
  {
    icon: Wrench,
    title: "Repair & Spare Parts",
    price: "From ₹499 visit",
    desc: "Fast diagnosis and repair for all major RO brands — motors, pumps, membranes, SMPS and housings.",
    points: ["Multi-brand expertise", "Genuine spares", "Transparent pricing", "Same-day slots"],
  },
  {
    icon: Search,
    title: "Water Testing",
    price: "Free with service",
    desc: "Lab-grade testing of TDS, hardness and contamination with a clear treatment recommendation.",
    points: ["Accurate TDS testing", "Contamination check", "Personalised advice", "No obligation"],
  },
  {
    icon: Repeat,
    title: "Filter & Membrane Replacement",
    price: "From ₹399",
    desc: "Timely replacement of sediment, carbon, RO membrane and UV lamps to protect water quality.",
    points: ["Reminder-driven", "Genuine components", "Quick fitting", "Performance check"],
  },
  {
    icon: ShieldCheck,
    title: "Commercial RO Systems",
    price: "On request",
    desc: "High-capacity RO plants for offices, restaurants, schools and apartments with custom AMC.",
    points: ["Capacity design", "Installation & plumbing", "Dedicated AMC", "24×7 support"],
  },
];

export default function ServicesPage() {
  return (
    <div className="container-page py-14">
      <SectionTitle
        title="Our Services"
        description="End-to-end RO water solutions for homes and businesses."
        right={<LinkButton href="/book">Book a service</LinkButton>}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="card-surface flex flex-col p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={24} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-800">{s.title}</h3>
              <div className="text-sm font-semibold text-aqua-600">{s.price}</div>
              <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-500" /> {p}
                  </li>
                ))}
              </ul>
              <LinkButton href="/book" variant="outline" size="sm" className="mt-5">
                Enquire now
              </LinkButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
