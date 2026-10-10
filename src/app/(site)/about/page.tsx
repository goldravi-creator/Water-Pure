import { Droplets, Target, HeartHandshake, Sparkles } from "lucide-react";
import { SectionTitle } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="container-page py-14">
      <SectionTitle
        title="About WaterPure"
        description="Clean, safe drinking water for every home — delivered reliably and managed smartly."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            WaterPure RO Services started with a simple belief: every family deserves
            pure, safe drinking water without the hassle of chasing technicians and
            service dates.
          </p>
          <p>
            Today we serve thousands of homes and businesses with installation,
            maintenance and repair of RO water purifiers. Every service request —
            whether from a phone call, a website form, or a marketing campaign —
            flows into one intelligent system that our AI assistant manages end to end.
          </p>
          <p>
            Our AI calls each new enquiry, understands the need, books a slot, and
            connects a human expert whenever someone wants a deeper conversation.
            The result: faster service, no missed leads, and water you can trust.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Target, title: "Our Mission", desc: "Pure water & effortless service for every home." },
            { icon: Sparkles, title: "AI-First", desc: "Automation that never lets a customer wait." },
            { icon: HeartHandshake, title: "Trust", desc: "Transparent pricing and verified technicians." },
            { icon: Droplets, title: "Quality", desc: "Genuine parts and lab-grade testing." },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="card-surface p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">{c.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
