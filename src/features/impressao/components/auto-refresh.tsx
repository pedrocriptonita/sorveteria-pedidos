"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Atualiza o painel periodicamente recarregando o Server Component (router
 * .refresh). Substitui o Supabase Realtime por polling — simples e sem mexer
 * no RLS. (Trocar por Realtime depois é um drop-in.)
 */
export function AutoRefresh({ intervalMs = 7000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
