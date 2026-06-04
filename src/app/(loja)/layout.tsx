import { CartProvider } from "@/features/catalogo/cart/cart-provider";
import { HeroProvider } from "@/features/catalogo/components/hero-context";
import { StoreHeader } from "@/features/catalogo/components/store-header";
import { LojaMain } from "@/features/catalogo/components/loja-main";
import { BottomNav } from "@/features/catalogo/components/bottom-nav";

export default function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <HeroProvider>
        <StoreHeader />
        {/* padding-top dinâmico: acompanha a altura do header (logo vs produto) */}
        <LojaMain>{children}</LojaMain>
        <BottomNav />
      </HeroProvider>
    </CartProvider>
  );
}
