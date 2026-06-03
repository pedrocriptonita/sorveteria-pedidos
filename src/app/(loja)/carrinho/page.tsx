import { getConfigLojaView } from "@/features/pedido/config";
import { CarrinhoView } from "@/features/catalogo/cart/carrinho-view";

export const dynamic = "force-dynamic";

export default async function CarrinhoPage() {
  const config = await getConfigLojaView();
  return <CarrinhoView pedidoMinimo={config?.pedidoMinimo ?? null} />;
}
