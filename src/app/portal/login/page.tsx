"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      if (data.devOtp) setDevOtp(String(data.devOtp));
      setStep("otp");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      router.push("/portal");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 via-brand-600 to-aqua-500 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Droplets size={26} />
          </span>
          <h1 className="mt-3 text-xl font-bold">Customer Portal</h1>
          <p className="text-sm text-white/80">Track bookings, services &amp; invoices</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={requestOtp} className="card-surface space-y-4 p-6">
            <Input
              label="Registered mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              inputMode="tel"
            />
            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="card-surface space-y-4 p-6">
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              OTP sent to {phone}
              {devOtp ? (
                <div className="mt-1 font-bold text-emerald-800">
                  (Demo mode — use OTP: {devOtp})
                </div>
              ) : null}
            </div>
            <Input
              label="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
            />
            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              Verify &amp; continue
            </Button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-center text-xs text-slate-400 hover:underline"
            >
              Change number
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-white/70">
          Staff member?{" "}
          <a href="/login" className="font-semibold text-white underline underline-offset-2">
            Sign in to the CRM
          </a>
        </p>
      </div>
    </div>
  );
}