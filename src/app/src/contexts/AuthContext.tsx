/**
 * Sessao do usuario logado, disponivel para qualquer tela via `useAuth()`.
 *
 * A sessao e salva no aparelho (`services/sessaoStorage.ts`): fechar e abrir
 * o app mantem o usuario logado ate o token vencer ou ele tocar em "sair".
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as authService from "../services/auth";
import type { DadosCadastro, Sessao, Usuario } from "../services/auth";
import { apagarSessao, carregarSessao, salvarSessao } from "../services/sessaoStorage";

type AuthContextValue = {
  usuario: Usuario | null;
  token: string | null;
  /** `true` enquanto le a sessao salva, logo que o app abre. */
  restaurando: boolean;
  /** Lanca `ApiError` em caso de falha - a tela decide como mostrar. */
  entrar: (ra: string, senha: string) => Promise<void>;
  registrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Falha ao gravar no aparelho nao deve impedir o login que a API ja aceitou:
 * o usuario entra do mesmo jeito, so nao fica lembrado.
 */
function gravarSemBloquear(acao: Promise<void>) {
  acao.catch((erro: unknown) => {
    console.warn("[PRAZZO] nao foi possivel atualizar a sessao salva:", erro);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [restaurando, setRestaurando] = useState(true);

  useEffect(() => {
    let ativo = true;
    carregarSessao().then((salva) => {
      if (!ativo) return;
      setSessao(salva);
      setRestaurando(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const valor = useMemo<AuthContextValue>(() => {
    function iniciar(nova: Sessao) {
      setSessao(nova);
      gravarSemBloquear(salvarSessao(nova));
    }

    return {
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      restaurando,
      entrar: async (ra, senha) => {
        iniciar(await authService.entrar(ra, senha));
      },
      registrar: async (dados) => {
        iniciar(await authService.registrar(dados));
      },
      sair: () => {
        setSessao(null);
        gravarSemBloquear(apagarSessao());
      },
    };
  }, [sessao, restaurando]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  }
  return contexto;
}
