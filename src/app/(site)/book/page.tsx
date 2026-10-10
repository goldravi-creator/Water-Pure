import { SectionTitle } from "@/components/ui";
import { BookingForm } from "@/components/site/booking-form";
import { CheckCircle2 } from "lucide-react";

export default function BookPage() {
  return (
    <div className="container-page grid gap-10 py-14 md:grid-cols-[1fr_420px]">
      <div>
        <SectionTitle
          title="Book a Service"
          description="Tell us what you need. Our AI assistant calls you back to confirm a slot — usually within minutes."
        />
        <ul className="space-y-3 text-sm text-slate-600">
          {[
            "Free water-quality check with every booking",
            "Verified, background-checked technicians",
            "Genuine spare parts with warranty",
            "WhatsApp confirmation & live status tracking",
            "Reschedule anytime via the customer portal",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-emerald-500" /> {t}
            </li>
          ))}
        </ul>
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-800">
            What happens after you submit?
          </h3>
          <ol className="mt-3 space-y-3 text-sm text-slate-600">
            <li><b>1.</b> Your request enters our system instantly.</li>
            <li><b>2.</b> An AI assistant calls to confirm details and a time slot.</li>
            <li><b>3.</b> A technician is assigned and you get WhatsApp updates.</li>
            <li><b>4.</b> Prefer a human? Just say so — we&apos;ll connect you.</li>
          </ol>
        </div>
      </div>
      <div>
        <BookingForm />
      </div>
    </div>
  );
}
