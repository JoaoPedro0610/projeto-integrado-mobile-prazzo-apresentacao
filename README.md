# PRAZZO

Gestão de tarefas acadêmicas com notificações inteligentes.
**"Organize. Planeje. Cumpra."**

O PRAZZO é um aplicativo mobile que ajuda estudantes a organizar disciplinas,
tarefas e prazos, enviando lembretes antes de cada entrega.

Projeto Integrado da disciplina de Desenvolvimento Mobile.

> **Status:** em desenvolvimento. Próximo marco: `v0.1.0-alpha` (Baseline Inicial: Estrutura e Configuração).

## Equipe

| # | Nome | Matrícula |
| - | ---- | --------- |
| 1 | Lucas Vieira Lopes | 0021545 |
| 2 | Hugo Carvalho de Menezes | 0021318 |
| 3 | Marcus Vinicius de Souza Marques | 0021530 |
| 4 | Leonardo de Sousa Teixeira | 0022004 |
| 5 | Gabriel Francelino | 0021540 |
| 6 | Raphael Eduardo Ferreira de Oliveira | 0021410 |
| 7 | Gabriel Neves Lourenço | 0020963 |
| 8 | Gustavo Mota Rodrigues | 0022125 |
| 9 | João Pedro da Silva Santos ([@JoaoPedro0610](https://github.com/JoaoPedro0610)), Scrum Master / Tech Lead | 0021871 |

## Tecnologias

- **App:** React Native + Expo + TypeScript
- **API:** Node.js + Express + TypeScript
- **Banco de dados:** PostgreSQL (via Docker)

## Estrutura do repositório

```
.
├── .github/          # Template de Pull Request
├── assets/           # Recursos estáticos da marca (logos, ícones, fontes)
├── docs/             # Documentação do projeto
│   ├── banco-de-dados/   # Modelo e regras do banco
│   ├── diagramas/        # Diagramas de arquitetura / classes
│   ├── prototipo/        # Protótipo original em HTML
│   ├── testes/           # Plano de testes e casos de teste
│   └── wireframes/       # Wireframes das telas
├── src/              # Código-fonte
│   ├── app/              # Mobile - React Native + Expo
│   ├── backend/          # API - Node.js + Express
│   └── start.ps1         # Sobe o emulador Android + app de uma vez
└── tests/            # Testes unitários, de integração e de UI
```

## Como rodar

Pré-requisitos: Node.js 20+, Docker (para o PostgreSQL) e o app **Expo Go**
no celular (ou um emulador Android/iOS).

### 1. Backend (porta 3333)

```bash
cd src/backend
npm install                 # só na primeira vez
cp .env.example .env        # Windows: Copy-Item .env.example .env
docker compose up -d --wait # sobe o PostgreSQL
npm run migrate
npm run seed
npm run dev
```

Confira em <http://localhost:3333/health>.

### 2. App (Expo)

Em **outro terminal**:

```bash
cd src/app
npm install    # só na primeira vez
npm start
```

Leia o QR Code com o Expo Go, ou tecle `a` (Android), `i` (iOS) ou `w` (web).

No Windows, `src/start.ps1` sobe o emulador Android e o app de uma vez.

## Fluxo de trabalho (Git Flow simplificado)

- `main`: produção. Só recebe código testado, via Pull Request.
- `develop`: integração. Todas as features se encontram aqui.
- `feature/<nome>`, `docs/<nome>`, `fix/<nome>`: branches de trabalho, criadas a partir da `develop`.

Todo merge em `main` e `develop` exige Pull Request com aprovação de pelo menos
1 outro membro da equipe.
