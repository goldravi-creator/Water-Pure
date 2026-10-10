import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WaterPure RO Services — Water Purifier Installation, Service & AMC",
    template: "%s · WaterPure RO Services",
  },
  description:
    "RO water purifier installation, service, repair and AMC. Book online, track your service, and get pure water at home. Managed end-to-end by AI.",
  keywords: [
    "RO service",
    "water purifier service",
    "RO installation",
    "RO AMC",
    "water purifier repair",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
