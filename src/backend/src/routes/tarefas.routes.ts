/**
 * Rotas de tarefas, montadas em `/tarefas` por `src/routes/index.ts`.
 *
 *   GET   /tarefas?inicio=<ISO>&fim=<ISO>   agenda do periodo
 *   POST  /tarefas                          cria uma tarefa
 *   PATCH /tarefas/:id/status               conclui ou reabre
 *
 * Todas exigem token.
 */
import { Router } from "express";

import {
  alterarStatus,
  criar,
  listar,
} from "../controllers/tarefas.controller";
import { autenticar } from "../middlewares/autenticacao";

export const tarefasRoutes = Router();

tarefasRoutes.use(autenticar);

tarefasRoutes.get("/", listar);
tarefasRoutes.post("/", criar);
tarefasRoutes.patch("/:id/status", alterarStatus);
