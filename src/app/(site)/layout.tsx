import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Chatbot } from "@/components/site/chatbot";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <Chatbot />
    </div>
  );
}
