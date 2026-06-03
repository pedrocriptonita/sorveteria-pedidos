import { CartProvider } from "@/features/catalogo/cart/cart-provider";
import { StoreHeader } from "@/features/catalogo/components/store-header";

/**
 * Layout da vitrine (route group sem segmento de URL). Provê o carrinho a
 * todas as telas da loja e o cabeçalho com o indicador. Admin/cozinha/login
 * ficam fora deste grupo e não montam o carrinho.
 */
export default function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StoreHeader />
      <div className="mx-auto max-w-3xl p-4">{children}</div>
    </CartProvider>
  );
}
