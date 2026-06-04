"use client";

import { useEffect } from "react";
import { useHero } from "./hero-context";

/**
 * Componente "invisível": publica a foto do produto no Hero ao montar e a
 * limpa ao desmontar (voltar ao catálogo). Recebe os dados já buscados no
 * server, então não há fetch extra no cliente.
 */
export function SetProdutoHero({
  foto,
  nome,
}: {
  foto: string | null;
  nome: string;
}) {
  const { setProdutoHero } = useHero();

  useEffect(() => {
    setProdutoHero({ foto, nome });
    return () => setProdutoHero(null);
  }, [foto, nome, setProdutoHero]);

  return null;
}
