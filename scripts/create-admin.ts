/**
 * Cria (ou atualiza) um usuário do backoffice: cria o usuário no Supabase Auth
 * e a linha correspondente em UsuarioAdmin, com o mesmo id.
 *
 * Requer SUPABASE_SERVICE_ROLE_KEY no ambiente.
 *
 * Uso:
 *   npm run create-admin -- <email> <senha> "<nome>" <ADMIN|COZINHA>
 * Ex.:
 *   npm run create-admin -- dono@sorveteria.com Senha123! "Maria" ADMIN
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, type PapelUsuario } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, senha, nome, papelArg] = process.argv.slice(2);

  if (!email || !senha || !nome || !papelArg) {
    console.error(
      'Uso: npm run create-admin -- <email> <senha> "<nome>" <ADMIN|COZINHA>',
    );
    process.exit(1);
  }

  const papel = papelArg.toUpperCase() as PapelUsuario;
  if (papel !== "ADMIN" && papel !== "COZINHA") {
    console.error(`Papel inválido: ${papelArg}. Use ADMIN ou COZINHA.`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Cria o usuário no Supabase Auth (email já confirmado).
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (error || !data.user) {
    console.error("Falha ao criar usuário no Supabase Auth:", error?.message);
    process.exit(1);
  }

  // 2) Cria/atualiza a linha em UsuarioAdmin com o MESMO id do Auth.
  await prisma.usuarioAdmin.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, email, nome, papel, ativo: true },
    update: { email, nome, papel, ativo: true, deletedAt: null },
  });

  console.log(`✓ Usuário criado: ${email} (${papel}) — id ${data.user.id}`);
}

main()
  .catch((err) => {
    console.error("Erro:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
