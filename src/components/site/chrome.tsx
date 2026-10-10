import Link from "next/link";
import { Droplets, Phone, Menu } from "lucide-react";
import { LinkButton } from "@/components/ui";

const APP = process.env.NEXT_PUBLIC_APP_NAME || "WaterPure RO Services";
const PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91-90000-00000";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Droplets size={18} />
          </span>
          <span className="text-base font-bold text-slate-800">{APP}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/services" className="hover:text-brand-600">
            Services
          </Link>
          <Link href="/pricing" className="hover:text-brand-600">
            Pricing &amp; AMC
          </Link>
          <Link href="/about" className="hover:text-brand-600">
            About
          </Link>
          <Link href="/contact" className="hover:text-brand-600">
            Contact
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-200"
          >
            Login
          </Link>
          <Link href="/portal/login" className="hover:text-brand-600">
            Customer Login
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${PHONE}`}
            className="hidden items-center gap-1.5 text-sm font-semibold text-brand-600 sm:flex"
          >
            <Phone size={16} /> {PHONE}
          </a>
          <LinkButton href="/book" size="sm">
            Book a Service
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Droplets size={16} />
            </span>
            <span className="font-bold">{APP}</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Pure water, always. RO installation, service, repair &amp; AMC — managed
            end-to-end and powered by AI.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Services</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/services" className="hover:text-white">New RO Installation</Link></li>
            <li><Link href="/services" className="hover:text-white">AMC / Service Plans</Link></li>
            <li><Link href="/services" className="hover:text-white">Repair &amp; Parts</Link></li>
            <li><Link href="/services" className="hover:text-white">Water Testing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Company</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/login" className="hover:text-white">Staff Login</Link></li>
            <li><Link href="/portal/login" className="hover:text-white">Customer Portal</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Get in touch</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>📞 {PHONE}</li>
            <li>✉️ care@waterpure.example</li>
            <li>🕒 Mon–Sat, 8am–8pm</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {APP}. All rights reserved.
      </div>
    </footer>
  );
}
