/**
 * Chamadas de autenticacao. Espelham `backend/src/routes/auth.routes.ts`:
 *
 *   POST /auth/registrar   { nome, ra, email, senha } -> { token, usuario }
 *   POST /auth/login       { ra, senha }              -> { token, usuario }
 *   GET  /auth/eu          (Bearer token)             -> { usuario }
 */
import { request } from "./api";

/** Usuario como a API devolve (`Usuario` em `backend/src/types/dominio.ts`). */
export type Usuario = {
  id: string;
  nome: string;
  ra: string;
  email: string;
  /** Datas chegam como string ISO: JSON nao tem tipo Date. */
  criadoEm: string;
  atualizadoEm: string;
};

export type Sessao = {
  token: string;
  usuario: Usuario;
};

export type DadosCadastro = {
  nome: string;
  ra: string;
  email: string;
  senha: string;
};

export function registrar(dados: DadosCadastro): Promise<Sessao> {
  return request<Sessao>("/auth/registrar", { method: "POST", body: dados });
}

export function entrar(ra: string, senha: string): Promise<Sessao> {
  return request<Sessao>("/auth/login", { method: "POST", body: { ra, senha } });
}

export function buscarUsuarioLogado(token: string): Promise<{ usuario: Usuario }> {
  return request<{ usuario: Usuario }>("/auth/eu", { token });
}
