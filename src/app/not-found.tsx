import Link from "next/link";

/** Página 404 amigável com a marca. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-5xl" aria-hidden>
        🍧
      </span>
      <h1 className="text-xl font-bold">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">
        O que você procura não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Voltar ao cardápio
      </Link>
    </main>
  );
}
