/**
 * Acesso a dados de disciplinas (Postgres).
 *
 * Implementa `DisciplinasRepository` de `src/types/`.
 */
import { query } from "../database/pool";
import type { Disciplina, DisciplinasRepository } from "../types";

export const disciplinasRepository: DisciplinasRepository = {
  async listarDoUsuario(usuarioId: string): Promise<Disciplina[]> {
    return query<Disciplina>(
      `SELECT id,
              usuario_id    AS "usuarioId",
              nome,
              codigo,
              cor,
              criado_em     AS "criadoEm",
              atualizado_em AS "atualizadoEm"
         FROM disciplinas
        WHERE usuario_id = $1
        ORDER BY nome`,
      [usuarioId]
    );
  },

  async pertenceAoUsuario(
    usuarioId: string,
    disciplinaId: string
  ): Promise<boolean> {
    const linhas = await query(
      `SELECT 1 FROM disciplinas WHERE id = $1 AND usuario_id = $2`,
      [disciplinaId, usuarioId]
    );
    return linhas.length > 0;
  },
};
