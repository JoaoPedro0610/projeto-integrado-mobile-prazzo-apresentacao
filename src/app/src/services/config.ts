/**
 * Configuracao de ambiente do app.
 *
 * Unico lugar que le `process.env`. O resto do app importa `config` daqui -
 * mesma regra do `config/env.ts` do backend.
 *
 * Os valores vem de `.env.development` (expo start) ou `.env.production`
 * (builds de release) e, no EAS Build, do bloco `env` de cada perfil do
 * `eas.json`. O Expo so embute no bundle variaveis com o prefixo
 * `EXPO_PUBLIC_`, e so quando escritas por extenso como abaixo:
 * `process.env[nome]` dinamico NAO funciona.
 */
type Ambiente = "development" | "production";

const ambiente: Ambiente =
  process.env.EXPO_PUBLIC_APP_ENV === "production" ? "production" : "development";

/** Sem barra no final, para as chamadas poderem concatenar "/auth/login". */
const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3333").replace(
  /\/+$/,
  ""
);

export const config = {
  ambiente,
  apiUrl,
  isProduction: ambiente === "production",
} as const;
