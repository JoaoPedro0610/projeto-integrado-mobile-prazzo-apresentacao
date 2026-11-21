/**
 * Chamadas de tarefas e disciplinas. Espelham as rotas do backend
 * (todas com Bearer token):
 *
 *   GET   /tarefas?inicio=<ISO>&fim=<ISO>  -> { tarefas }
 *   POST  /tarefas                         -> { tarefa }
 *   PATCH /tarefas/:id/status              -> { tarefa }
 *   GET   /disciplinas                     -> { disciplinas }
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

export type DadosNovaTarefa = {
  titulo: string;
  descricao?: string;
  tipo: TarefaTipo;
  prioridade: TarefaPrioridade;
  prazo: Date;
  disciplinaId?: string | null;
};

/** Lanca `ApiError` com `campos` (titulo, tipo, prazo...) se a API recusar. */
export async function criarTarefa(
  token: string,
  dados: DadosNovaTarefa
): Promise<TarefaApi> {
  const { tarefa } = await request<{ tarefa: TarefaApi }>("/tarefas", {
    method: "POST",
    token,
    body: { ...dados, prazo: dados.prazo.toISOString() },
  });
  return tarefa;
}

export async function alterarStatusTarefa(
  token: string,
  id: string,
  concluida: boolean
): Promise<TarefaApi> {
  const { tarefa } = await request<{ tarefa: TarefaApi }>(
    `/tarefas/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      token,
      body: { status: concluida ? "concluida" : "pendente" },
    }
  );
  return tarefa;
}

export type DisciplinaApi = {
  id: string;
  nome: string;
  codigo: string | null;
  cor: string | null;
};

export async function listarDisciplinas(token: string): Promise<DisciplinaApi[]> {
  const { disciplinas } = await request<{ disciplinas: DisciplinaApi[] }>(
    "/disciplinas",
    { token }
  );
  return disciplinas;
}
