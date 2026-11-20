# Deploy do MVP - PRAZZO

Estratégia escolhida: **Opção B - Distribuição Controlada**, Android, via
**Firebase App Distribution**, com o mesmo APK espelhado no **GitHub Releases**.

Motivo: é gratuita e sai no mesmo dia. A Play Store cobra US$ 25 e exige, para
contas pessoais novas, um teste fechado com 12 testadores por 14 dias antes de
liberar a produção; a App Store custa US$ 99 por ano.

## O que cada item do roteiro virou no projeto

| Item do roteiro | Onde está |
| --- | --- |
| Variáveis de ambiente | App: `src/app/.env.development`, `src/app/.env.production`, lidas só por `src/app/src/services/config.ts`. API: `render.yaml` (os segredos ficam no painel do Render, não no Git). |
| Assinatura do app | `src/app/scripts/gerar-keystore.ps1` cria `src/app/credentials/prazzo-release.keystore` (fora do Git). |
| Otimização e ofuscação | Plugin `expo-build-properties` no `src/app/app.json`: `enableMinifyInReleaseBuilds` (R8) e `enableShrinkResourcesInReleaseBuilds`. |
| Identidade visual | Ícone adaptativo e splash no `src/app/app.json`; as imagens são geradas por `src/app/scripts/gerar-icones.ps1` a partir da logo. |
| Build de release | `src/app/scripts/build-release.ps1` (local) ou `eas build -p android --profile production` (nuvem, perfil em `src/app/eas.json`). |

## Passo a passo

### 1. API e banco em produção (Render)

1. Entre em <https://render.com> com a conta do GitHub.
2. **New > Blueprint**, escolha este repositório e a branch `main`, **Apply**.
   O `render.yaml` cria o Postgres `prazzo-db` e a API `prazzo-api`, gera o
   `JWT_SECRET` e aplica as migrations na subida.
3. Abra `https://<url-da-api>/health` e confira `"banco": "conectado"` e
   `"environment": "production"`.
4. Se a URL não for `https://prazzo-api.onrender.com`, troque nos dois lugares:
   `src/app/.env.production` e o perfil `production` do `src/app/eas.json`.

O plano gratuito dorme após 15 minutos sem uso e o Postgres gratuito expira em
30 dias. Para a apresentação, abra o `/health` alguns minutos antes.

### 2. Gerar o APK assinado

```powershell
cd src/app
npm install
.\scripts\gerar-keystore.ps1   # uma única vez; faça backup da pasta credentials/
.\scripts\build-release.ps1    # saída: dist/prazzo-v1.0.0.apk
```

A cada nova versão, aumente `version` e `android.versionCode` no `app.json`
antes de buildar. O Android recusa instalar por cima um APK com `versionCode`
igual ou menor.

### 3. Firebase App Distribution

1. <https://console.firebase.google.com> > **Adicionar projeto** > `prazzo`.
2. Adicione um app **Android** com o pacote `com.prazzo.app`. Não é preciso
   baixar o `google-services.json`: o App Distribution não exige o SDK.
3. **Executar > App Distribution > Primeiros passos**, arraste o APK.
4. Aba **Testadores e grupos**: crie o grupo `mvp` e cole os 15 ou mais e-mails.
5. Distribua a versão para o grupo, com notas da versão.
6. Aba **Links de convite**: crie um link para o grupo `mvp`. É esse o link a
   entregar ao professor.

### 4. Espelho no GitHub Releases

Depois do merge na `main`:

```powershell
git tag -a v1.0.0 -m "MVP - lançamento oficial"
git push origin v1.0.0
gh release create v1.0.0 src/app/dist/prazzo-v1.0.0.apk --title "PRAZZO v1.0.0 (MVP)" --notes "Primeira versão pública."
```

## Prints para o Relatório de Deploy (PDF)

- [ ] Painel do Render: serviço `prazzo-api` no ar e aba **Environment** (valores ocultos)
- [ ] Painel do Render: banco `prazzo-db`
- [ ] `/health` da URL pública respondendo `production`
- [ ] `.env.production` e `config.ts` do app
- [ ] Saída do `keytool -list -v -keystore credentials\prazzo-release.keystore` (sem a senha)
- [ ] Trecho do `app.json` com R8/shrink ligados, e o tamanho final do APK
- [ ] Ícone do app na gaveta do Android e a splash abrindo
- [ ] Firebase: versão enviada, grupo com os 15 testadores e status dos convites
- [ ] Fotos ou prints do app instalado em celulares físicos
- [ ] Página do release `v1.0.0` no GitHub

## Limitação conhecida do MVP

As telas ainda usam os dados de exemplo de `src/app/src/data/agenda.ts`, e o
login valida só o formato dos campos. A API de produção já sobe com `/auth`,
mas o app ainda não a chama: a ligação é a ETAPA 4 e usa `config.apiUrl`.
