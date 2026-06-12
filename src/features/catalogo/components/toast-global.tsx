"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const TOAST_KEY = "sorveteria:toast";
const TOAST_EVENT = "sorveteria:toast";

/** Agenda um toast: aparece imediatamente (evento) e sobrevive à navegação (sessionStorage). */
export function agendarToast(mensagem: string) {
  sessionStorage.setItem(TOAST_KEY, mensagem);
  window.dispatchEvent(new CustomEvent(TOAST_EVENT));
}

/** Exibe o toast pendente por 2.5s. Reage a navegação e ao evento de agendamento. */
export function ToastGlobal() {
  const pathname = usePathname();
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    function consumir() {
      const msg = sessionStorage.getItem(TOAST_KEY);
      if (!msg) return;
      sessionStorage.removeItem(TOAST_KEY);
      setMensagem(msg);
    }
    consumir(); // ao montar e a cada troca de rota
    window.addEventListener(TOAST_EVENT, consumir);
    return () => window.removeEventListener(TOAST_EVENT, consumir);
  }, [pathname]);

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 2500);
    return () => clearTimeout(t);
  }, [mensagem]);

  if (!mensagem) return null;

  return (
    <div
      className="toast-enter fixed inset-x-0 z-50 flex justify-center"
      style={{ bottom: "90px" }}
    >
      <div className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-medium text-white shadow-lg">
        <span>✓</span>
        <span>{mensagem}</span>
      </div>
    </div>
  );
}
