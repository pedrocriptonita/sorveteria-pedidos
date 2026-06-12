import type { NextConfig } from "next";

// Headers de segurança aplicados a todas as respostas. CSP fica de fora por
// enquanto (exige testar inline styles, Supabase, QR data-URI e a fonte de
// ícones) — pode ser adicionada depois com cuidado.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // HSTS: navegadores ignoram em http (dev); ativo só em produção (https).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["automated-unturned-previous.ngrok-free.dev"],
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    formats: ["image/webp"],
    // Cache de imagens otimizadas por 7 dias (evita reprocessar a cada request).
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
