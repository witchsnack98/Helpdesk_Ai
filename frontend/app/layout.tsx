import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Helpdesk — Enterprise Support System",
    template: "%s | AI Helpdesk",
  },
  description:
    "AI-Powered enterprise helpdesk system with intelligent ticket triage, RAG chatbot, and real-time support.",
  keywords: ["helpdesk", "support", "AI", "ticketing", "enterprise"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
