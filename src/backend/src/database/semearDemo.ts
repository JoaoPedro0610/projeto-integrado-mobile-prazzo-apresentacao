/**
 * Recria a conta de demonstracao na subida da API, quando `SEED_DEMO=true`.
 *
 * Roda entre as migrations e o servidor no `npm run start:prod`. No Render o
 * plano gratuito desliga a API apos 15 min sem uso e a religa na proxima
 * requisicao, entao cada subida "move" as tarefas de exemplo para a semana
 * atual - a agenda da apresentacao nunca aparece com datas velhas.
 *
 * So mexe no usuario de exemplo (RA do seed). Contas reais nao sao tocadas.
 * Sem a variavel, nao faz nada: e o comportamento padrao de qualquer ambiente.
 */
import { fecharPool } from "./pool";
import { popularBanco } from "./seed";

async function main(): Promise<void> {
  if (process.env.SEED_DEMO !== "true") {
    console.log("[seed-demo] SEED_DEMO diferente de 'true': nada a fazer.");
    return;
  }
  await popularBanco();
}

main()
  .catch((erro: unknown) => {
    // Falhar aqui nao deve impedir a API de subir: a conta de demonstracao e
    // conveniencia, o login das contas reais continua funcionando sem ela.
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.error("[seed-demo] falhou, seguindo sem a conta de exemplo:", mensagem);
  })
  .finally(fecharPool);
