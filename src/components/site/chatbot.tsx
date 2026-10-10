"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Droplets } from "lucide-react";

type Msg = { role: "user" | "bot"; text: string };

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Namaste! 🙏 I'm Aarav, your WaterPure assistant. Ask me about RO installation, service charges, AMC plans or book a visit.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<{ name?: string; phone?: string }>({});

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages.slice(-6), lead: leadRef.current }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
      if (data.lead) leadRef.current = data.lead;
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Sorry, please try again or call us directly." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-4 z-40 flex h-[440px] w-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Droplets size={18} />
              <div className="leading-tight">
                <div className="text-sm font-semibold">WaterPure Assistant</div>
                <div className="text-[11px] opacity-80">
                  AI · typically replies instantly
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:opacity-80">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="text-xs text-slate-400">Aarav is typing…</div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type your message…"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <button
              onClick={send}
              disabled={loading}
              className="rounded-lg bg-brand-600 p-2 text-white disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setOpen((o) => !o)}
        className="animate-pulse-ring fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 sm:right-6"
        aria-label="Open chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
