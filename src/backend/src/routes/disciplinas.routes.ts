/**
 * Rotas de disciplinas, montadas em `/disciplinas` por `src/routes/index.ts`.
 *
 *   GET /disciplinas   disciplinas do usuario logado (para o formulario de tarefa)
 */
import { Router, type Request, type Response } from "express";

import { autenticar, usuarioDoPedido } from "../middlewares/autenticacao";
import { disciplinasRepository } from "../repositories/disciplinas.repository";

export const disciplinasRoutes = Router();

disciplinasRoutes.use(autenticar);

disciplinasRoutes.get("/", async (req: Request, res: Response) => {
  const { sub } = usuarioDoPedido(req);
  res.json({ disciplinas: await disciplinasRepository.listarDoUsuario(sub) });
});
