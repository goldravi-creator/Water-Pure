"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Droplets, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/crm";

  const [email, setEmail] = useState("owner@waterpure.example");
  const [password, setPassword] = useState("owner123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(next);
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
          <h1 className="mt-3 text-xl font-bold">WaterPure CRM</h1>
          <p className="text-sm text-white/80">Unified AI telecalling &amp; lead panel</p>
        </div>

        <form onSubmit={submit} className="card-surface space-y-4 p-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-white/70">
          Demo accounts — owner@waterpure.example / owner123 · manager@waterpure.example / manager123
          <br />
          agent@waterpure.example / agent123
        </p>
        <p className="mt-3 text-center text-xs text-white/70">
          Customers:{" "}
          <a href="/portal/login" className="font-semibold text-white underline underline-offset-2">
            login to the customer portal here
          </a>
        </p>
      </div>
    </div>
  );
}