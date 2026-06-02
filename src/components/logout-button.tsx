import { logout } from "@/lib/auth/actions";

/** Botão de sair: aciona a Server Action de logout via <form>. */
export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        Sair
      </button>
    </form>
  );
}
