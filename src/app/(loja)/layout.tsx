import { CartProvider } from "@/features/catalogo/cart/cart-provider";
import { StoreHeader } from "@/features/catalogo/components/store-header";
import { BottomNav } from "@/features/catalogo/components/bottom-nav";

export default function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <StoreHeader />
      {/* pt-16 = altura do header, pb-24 = espaço do bottom nav */}
      <main className="mx-auto max-w-md px-4 pt-20 pb-28">
        {children}
      </main>
      <BottomNav />
    </CartProvider>
  );
}
