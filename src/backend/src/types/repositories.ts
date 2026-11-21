/**
 * Contratos de acesso a dados.
 *
 * Os controllers dependem destas interfaces, nunca da implementacao - e o que
 * mantem a promessa do README: trocar o que ha dentro de
 * `src/repositories/` nao mexe em controller nem em rota.
 *
 * As interfaces de disciplinas e notificacoes entram na ETAPA 6, junto das
 * respectivas implementacoes.
 */
import type {
  DadosNovoUsuario,
  TarefaDaAgenda,
  Usuario,
  UsuarioComSenha,
} from "./dominio";

export interface TarefasRepository {
  /**
   * Tarefas do usuario com prazo em [inicio, fim), em ordem de prazo.
   * Canceladas ficam de fora: nao sao compromisso na agenda.
   */
  listarPorPeriodo(
    usuarioId: string,
    inicio: Date,
    fim: Date
  ): Promise<TarefaDaAgenda[]>;
}

export interface UsuariosRepository {
  criar(dados: DadosNovoUsuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  /** Usado no login: e o unico lugar que precisa do hash da senha. */
  buscarPorRaComSenha(ra: string): Promise<UsuarioComSenha | null>;
  raEmUso(ra: string): Promise<boolean>;
  emailEmUso(email: string): Promise<boolean>;
}
