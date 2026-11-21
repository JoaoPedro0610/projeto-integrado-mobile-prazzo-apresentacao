/**
 * Chamadas de tarefas. Espelham `backend/src/routes/tarefas.routes.ts`:
 *
 *   GET /tarefas?inicio=<ISO>&fim=<ISO>   (Bearer token) -> { tarefas }
 */
import { request } from "./api";

export type TarefaTipo = "prova" | "trabalho" | "leitura" | "entrega" | "outro";
export type TarefaPrioridade = "urgente" | "normal";
export type TarefaStatus = "pendente" | "concluida" | "cancelada";

/** Tarefa como a API devolve (`TarefaDaAgenda` no backend). */
export type TarefaApi = {
  id: string;
  disciplinaId: string | null;
  disciplinaNome: string | null;
  titulo: string;
  descricao: string | null;
  tipo: TarefaTipo;
  prioridade: TarefaPrioridade;
  status: TarefaStatus;
  /** Instante ISO 8601. */
  prazo: string;
  concluidaEm: string | null;
};

/** Tarefas com prazo em [inicio, fim), ja em ordem de prazo. */
export async function listarTarefas(
  token: string,
  inicio: Date,
  fim: Date
): Promise<TarefaApi[]> {
  const parametros = `inicio=${encodeURIComponent(inicio.toISOString())}` +
    `&fim=${encodeURIComponent(fim.toISOString())}`;

  const { tarefas } = await request<{ tarefas: TarefaApi[] }>(
    `/tarefas?${parametros}`,
    { token }
  );
  return tarefas;
}
