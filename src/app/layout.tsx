import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sorveteria — Pedidos",
  description:
    "Sistema próprio de pedidos e cardápio digital da sorveteria (MVP).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={jakartaSans.variable}>
      <head>
        {/* Material Symbols Outlined — next/font não suporta variable icon fonts */}
        {/* eslint-disable @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
        {/* eslint-enable @next/next/no-page-custom-font, @next/next/google-font-display */}
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
