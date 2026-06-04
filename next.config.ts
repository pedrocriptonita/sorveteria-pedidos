import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["automated-unturned-previous.ngrok-free.dev"],
  // Fotos de produtos virão do Supabase Storage (Fase 4 — catálogo).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
