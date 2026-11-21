/**
 * Acesso a dados de tarefas (Postgres).
 *
 * Implementa `TarefasRepository` de `src/types/`.
 *
 * Em toda consulta o `usuario_id` vem SEMPRE do token, nunca da requisicao:
 * e o que impede um usuario de ler ou alterar as tarefas de outro trocando um
 * parametro.
 */
import { query, queryUm } from "../database/pool";
import type {
  DadosNovaTarefa,
  TarefaDaAgenda,
  TarefasRepository,
} from "../types";

/**
 * Colunas da tarefa com alias em camelCase, mais o nome da disciplina.
 * Usado com `FROM tarefas t LEFT JOIN disciplinas d ON d.id = t.disciplina_id`.
 */
const CAMPOS = `
  t.id,
  t.usuario_id    AS "usuarioId",
  t.disciplina_id AS "disciplinaId",
  d.nome          AS "disciplinaNome",
  t.titulo,
  t.descricao,
  t.tipo,
  t.prioridade,
  t.status,
  t.prazo,
  t.concluida_em  AS "concluidaEm",
  t.criado_em     AS "criadoEm",
  t.atualizado_em AS "atualizadoEm"
`;

/** Busca uma tarefa ja com o nome da disciplina (usado apos INSERT/UPDATE). */
async function buscarDaAgenda(
  usuarioId: string,
  tarefaId: string
): Promise<TarefaDaAgenda | null> {
  return queryUm<TarefaDaAgenda>(
    `SELECT ${CAMPOS}
       FROM tarefas t
       LEFT JOIN disciplinas d ON d.id = t.disciplina_id
      WHERE t.id = $1 AND t.usuario_id = $2`,
    [tarefaId, usuarioId]
  );
}

export const tarefasRepository: TarefasRepository = {
  async listarPorPeriodo(
    usuarioId: string,
    inicio: Date,
    fim: Date
  ): Promise<TarefaDaAgenda[]> {
    // O filtro `usuario_id + prazo` e a ordenacao por `prazo` sao atendidos
    // pelo indice `tarefas_agenda` (migration 003) num unico acesso.
    return query<TarefaDaAgenda>(
      `SELECT ${CAMPOS}
         FROM tarefas t
         LEFT JOIN disciplinas d ON d.id = t.disciplina_id
        WHERE t.usuario_id = $1
          AND t.prazo >= $2
          AND t.prazo <  $3
          AND t.status <> 'cancelada'
        ORDER BY t.prazo, t.titulo`,
      [usuarioId, inicio, fim]
    );
  },

  async criar(dados: DadosNovaTarefa): Promise<TarefaDaAgenda> {
    const criada = await queryUm<{ id: string }>(
      `INSERT INTO tarefas
         (usuario_id, disciplina_id, titulo, descricao, tipo, prioridade, prazo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        dados.usuarioId,
        dados.disciplinaId,
        dados.titulo,
        dados.descricao,
        dados.tipo,
        dados.prioridade,
        dados.prazo,
      ]
    );

    const tarefa = criada && (await buscarDaAgenda(dados.usuarioId, criada.id));
    if (!tarefa) {
      throw new Error("INSERT em tarefas nao devolveu a tarefa criada.");
    }
    return tarefa;
  },

  async alterarStatus(
    usuarioId: string,
    tarefaId: string,
    concluida: boolean
  ): Promise<TarefaDaAgenda | null> {
    // `status` e `concluida_em` mudam juntos no mesmo UPDATE: a restricao
    // `tarefa_conclusao_coerente` da migration 003 recusaria um sem o outro.
    const alterada = await queryUm<{ id: string }>(
      `UPDATE tarefas
          SET status       = $3,
              concluida_em = CASE WHEN $4::boolean THEN now() ELSE NULL END
        WHERE id = $1 AND usuario_id = $2
        RETURNING id`,
      [tarefaId, usuarioId, concluida ? "concluida" : "pendente", concluida]
    );

    return alterada ? buscarDaAgenda(usuarioId, alterada.id) : null;
  },
};
