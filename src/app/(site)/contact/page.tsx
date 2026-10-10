import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { SectionTitle } from "@/components/ui";
import { BookingForm } from "@/components/site/booking-form";

export default function ContactPage() {
  const phone = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91-90000-00000";
  return (
    <div className="container-page py-14">
      <SectionTitle
        title="Contact Us"
        description="We're here to help — by phone, email, or a quick callback."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: Phone, title: "Call us", value: phone },
            { icon: Mail, title: "Email", value: "care@waterpure.example" },
            { icon: MapPin, title: "Office", value: "123 Water Works Road, Lucknow, UP 226010" },
            { icon: Clock, title: "Hours", value: "Mon–Sat, 8:00am – 8:00pm" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="card-surface flex items-start gap-4 p-5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </span>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {c.title}
                  </div>
                  <div className="text-sm font-medium text-slate-700">{c.value}</div>
                </div>
              </div>
            );
          })}
          <div className="rounded-xl bg-brand-50 p-5 text-sm text-brand-800">
            <b>Prefer a callback?</b> Fill the form and our AI assistant will call you
            back within minutes to confirm your service.
          </div>
        </div>
        <BookingForm />
      </div>
    </div>
  );
}
