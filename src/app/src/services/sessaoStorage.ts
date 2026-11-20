/**
 * Guarda a sessao (token + usuario) no armazenamento seguro do aparelho:
 * Keystore no Android, Keychain no iOS (`expo-secure-store`).
 *
 * No navegador (`expo start --web`) o SecureStore nao existe: la a sessao
 * simplesmente nao e lembrada, e o app pede login de novo ao recarregar.
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import type { Sessao } from "./auth";

/** Chaves do SecureStore aceitam apenas letras, digitos, ".", "-" e "_". */
const CHAVE = "prazzo.sessao";

const disponivel = Platform.OS !== "web";

export async function salvarSessao(sessao: Sessao): Promise<void> {
  if (!disponivel) return;
  await SecureStore.setItemAsync(CHAVE, JSON.stringify(sessao));
}

export async function apagarSessao(): Promise<void> {
  if (!disponivel) return;
  await SecureStore.deleteItemAsync(CHAVE);
}

/**
 * Devolve a sessao salva, ou `null` se nao houver, se estiver corrompida ou se
 * o token ja venceu (o backend emite JWT com validade, `JWT_EXPIRES_IN`).
 */
export async function carregarSessao(): Promise<Sessao | null> {
  if (!disponivel) return null;

  try {
    const bruto = await SecureStore.getItemAsync(CHAVE);
    if (!bruto) return null;

    const sessao = JSON.parse(bruto) as Sessao;
    if (!sessao?.token || !sessao?.usuario || tokenVencido(sessao.token)) {
      await apagarSessao();
      return null;
    }
    return sessao;
  } catch {
    // Dado ilegivel (ex.: chave do Keystore invalidada) nao pode travar a
    // abertura do app: trata como "sem sessao".
    await apagarSessao().catch(() => undefined);
    return null;
  }
}

/**
 * Le o `exp` do JWT sem conferir a assinatura - isso continua sendo papel da
 * API. Aqui serve so para nao abrir o Dashboard com um token que a API ja
 * vai recusar. Token sem `exp` legivel e tratado como vencido.
 */
function tokenVencido(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    // JWT usa base64url sem "=" no final; o `atob` espera base64 classico.
    const semPadding = payload.replace(/-/g, "+").replace(/_/g, "/");
    const base64 = semPadding.padEnd(Math.ceil(semPadding.length / 4) * 4, "=");
    const { exp } = JSON.parse(atob(base64)) as { exp?: unknown };

    // Margem de 1 min para o token nao vencer no meio da primeira chamada.
    return typeof exp !== "number" || exp * 1000 <= Date.now() + 60_000;
  } catch {
    return true;
  }
}
