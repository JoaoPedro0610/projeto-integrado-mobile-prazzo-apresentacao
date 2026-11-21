/**
 * Rotas de tarefas, montadas em `/tarefas` por `src/routes/index.ts`.
 *
 *   GET /tarefas?inicio=<ISO>&fim=<ISO>   exige token
 */
import { Router } from "express";

import { listar } from "../controllers/tarefas.controller";
import { autenticar } from "../middlewares/autenticacao";

export const tarefasRoutes = Router();

// Todas as rotas daqui sao do usuario logado.
tarefasRoutes.use(autenticar);

tarefasRoutes.get("/", listar);
