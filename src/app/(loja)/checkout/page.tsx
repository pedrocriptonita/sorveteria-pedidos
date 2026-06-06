import { redirect } from "next/navigation";

// Rota antiga: o checkout virou parte do hub /pedidos (login leve + histórico).
// Mantemos o redirect para não quebrar links/atalhos existentes.
export default function CheckoutPage() {
  redirect("/pedidos");
}
