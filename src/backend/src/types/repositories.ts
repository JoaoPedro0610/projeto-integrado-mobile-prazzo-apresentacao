/**
 * Contratos de acesso a dados.
 *
 * Os controllers dependem destas interfaces, nunca da implementacao - e o que
 * mantem a promessa do README: trocar o que ha dentro de
 * `src/repositories/` nao mexe em controller nem em rota.
 *
 * A interface de notificacoes entra na ETAPA 6, junto da implementacao.
 */
import type {
  DadosNovaTarefa,
  DadosNovoUsuario,
  Disciplina,
  TarefaDaAgenda,
  Usuario,
  UsuarioComSenha,
} from "./dominio";

export interface UsuariosRepository {
  criar(dados: DadosNovoUsuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  /** Usado no login: e o unico lugar que precisa do hash da senha. */
  buscarPorRaComSenha(ra: string): Promise<UsuarioComSenha | null>;
  raEmUso(ra: string): Promise<boolean>;
  emailEmUso(email: string): Promise<boolean>;
}

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

  criar(dados: DadosNovaTarefa): Promise<TarefaDaAgenda>;

  /**
   * Marca como concluida (com a data de agora) ou devolve para pendente.
   * Devolve `null` se a tarefa nao existe OU e de outro usuario - o
   * controller responde 404 nos dois casos, sem revelar qual foi.
   */
  alterarStatus(
    usuarioId: string,
    tarefaId: string,
    concluida: boolean
  ): Promise<TarefaDaAgenda | null>;
}

export interface DisciplinasRepository {
  listarDoUsuario(usuarioId: string): Promise<Disciplina[]>;
  /** `true` se a disciplina existe e e deste usuario. */
  pertenceAoUsuario(usuarioId: string, disciplinaId: string): Promise<boolean>;
}
