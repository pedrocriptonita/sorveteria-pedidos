import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorveteria — Pedidos",
  description:
    "Sistema próprio de pedidos e cardápio digital da sorveteria (MVP).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
