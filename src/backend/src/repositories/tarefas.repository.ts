/**
 * Acesso a dados de tarefas (Postgres).
 *
 * Implementa `TarefasRepository` de `src/types/`.
 */
import { query } from "../database/pool";
import type { TarefaDaAgenda, TarefasRepository } from "../types";

export const tarefasRepository: TarefasRepository = {
  async listarPorPeriodo(
    usuarioId: string,
    inicio: Date,
    fim: Date
  ): Promise<TarefaDaAgenda[]> {
    // O filtro `usuario_id + prazo` e a ordenacao por `prazo` sao atendidos
    // pelo indice `tarefas_agenda` (migration 003) num unico acesso.
    //
    // `usuario_id` vem SEMPRE do token, nunca da requisicao: e o que impede um
    // usuario de listar as tarefas de outro trocando um parametro.
    return query<TarefaDaAgenda>(
      `SELECT t.id,
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
};
