/**
 * Cliente HTTP do PRAZZO: o unico lugar do app que chama `fetch`.
 *
 * Toda resposta de erro da API tem o formato `{ erro, campos? }` (ver
 * `backend/src/middlewares/erros.ts`). Aqui ela vira um `ApiError`, para as
 * telas tratarem um tipo so - inclusive quando o problema e a rede, e nao a API.
 */
import { config } from "./config";

/**
 * O plano gratuito do Render "dorme" apos 15 min sem uso e a primeira
 * requisicao seguinte leva ~1 min. Um limite menor que isso faria o primeiro
 * login do dia falhar sempre.
 */
const TIMEOUT_MS = 70_000;

export class ApiError extends Error {
  constructor(
    /** Status HTTP. `0` quando nem chegou resposta (sem rede, timeout). */
    readonly status: number,
    message: string,
    /** Erro por campo, com as chaves da API (nome, ra, email, senha). */
    readonly campos: Readonly<Record<string, string>> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Opcoes = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
};

export async function request<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  // AbortController + setTimeout: o `AbortSignal.timeout` nao existe em todas
  // as versoes do Hermes.
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);

  let resposta: Response;
  try {
    resposta = await fetch(`${config.apiUrl}${caminho}`, {
      method: opcoes.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(opcoes.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(opcoes.token ? { Authorization: `Bearer ${opcoes.token}` } : {}),
      },
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
      signal: controle.signal,
    });
  } catch {
    throw new ApiError(
      0,
      controle.signal.aborted
        ? "O servidor demorou demais para responder. Tente de novo."
        : "Nao foi possivel conectar ao servidor. Verifique a sua internet."
    );
  } finally {
    clearTimeout(timer);
  }

  // Corpo vazio ou que nao e JSON (ex.: pagina de erro de um proxy) nao pode
  // derrubar o app com um SyntaxError.
  const corpo: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = (corpo ?? {}) as { erro?: unknown; campos?: unknown };
    throw new ApiError(
      resposta.status,
      typeof erro.erro === "string" ? erro.erro : "Erro inesperado no servidor.",
      erro.campos && typeof erro.campos === "object"
        ? (erro.campos as Record<string, string>)
        : {}
    );
  }

  return corpo as T;
}
