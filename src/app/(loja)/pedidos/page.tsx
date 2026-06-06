import { getConfigLojaView } from "@/features/pedido/config";
import { PedidosHub } from "@/features/pedido/components/pedidos-hub";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const config = await getConfigLojaView();
  return <PedidosHub config={config} />;
}
