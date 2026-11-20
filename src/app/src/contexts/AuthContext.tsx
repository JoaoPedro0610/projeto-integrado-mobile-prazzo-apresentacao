/**
 * Sessao do usuario logado, disponivel para qualquer tela via `useAuth()`.
 *
 * A sessao fica so em memoria: fechar o app desloga. Para lembrar o login,
 * o proximo passo e guardar o token com `expo-secure-store` e, ao abrir o
 * app, validar com `buscarUsuarioLogado` (GET /auth/eu).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import * as authService from "../services/auth";
import type { DadosCadastro, Sessao, Usuario } from "../services/auth";

type AuthContextValue = {
  usuario: Usuario | null;
  token: string | null;
  /** Lanca `ApiError` em caso de falha - a tela decide como mostrar. */
  entrar: (ra: string, senha: string) => Promise<void>;
  registrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);

  const valor = useMemo<AuthContextValue>(
    () => ({
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      entrar: async (ra, senha) => {
        setSessao(await authService.entrar(ra, senha));
      },
      registrar: async (dados) => {
        setSessao(await authService.registrar(dados));
      },
      sair: () => setSessao(null),
    }),
    [sessao]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  }
  return contexto;
}
