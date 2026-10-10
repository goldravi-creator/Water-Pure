"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

export function ResolveButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function resolve() {
    setBusy(true);
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="success" onClick={resolve} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" size={13} /> : <CheckCircle2 size={13} />}
      Resolve
    </Button>
  );
}