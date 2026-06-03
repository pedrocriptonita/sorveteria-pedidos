/**
 * Valida a conectividade com o PSP de PIX configurado (PSP_PROVIDER).
 * Não cria cobrança — apenas confirma que as credenciais autenticam.
 *
 * Uso: npm run validate:psp
 */
import { getPsp } from "@/lib/psp";

async function main() {
  const psp = getPsp();
  console.log(`Provider configurado: ${psp.nome}`);

  const r = await psp.verificarConexao();
  if (r.ok) {
    console.log(`✓ ${r.detalhe}`);
  } else {
    console.error(`✗ Falha: ${r.detalhe}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erro:", (err as Error).message);
  process.exit(1);
});
