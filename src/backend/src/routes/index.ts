/**
 * Reune as rotas da API. O `server.ts` monta so este router, entao acrescentar
 * um recurso novo (tarefas, disciplinas) e uma linha aqui.
 */
import { Router } from "express";

import { authRoutes } from "./auth.routes";
import { disciplinasRoutes } from "./disciplinas.routes";
import { tarefasRoutes } from "./tarefas.routes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/tarefas", tarefasRoutes);
routes.use("/disciplinas", disciplinasRoutes);
