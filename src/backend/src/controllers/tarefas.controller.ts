/**
 * Tarefas (os "Prazzos") do usuario logado.
 */
import type { Request, Response } from "express";

import { usuarioDoPedido } from "../middlewares/autenticacao";
import { ErroHttp } from "../middlewares/erros";
import { tarefasRepository } from "../repositories/tarefas.repository";

/**
 * Teto do periodo de uma consulta. A agenda pede uma semana; o limite so
 * impede que um cliente peca "todas as tarefas desde 1970" numa chamada.
 */
const PERIODO_MAXIMO_DIAS = 62;

/**
 * Le um instante ISO 8601 da query string.
 *
 * O app manda o inicio e o fim da semana ja no fuso do aparelho
 * (`segunda 00:00` local, convertido com `toISOString()`). Por isso a API nao
 * decide sozinha onde a semana comeca: "segunda-feira" depende do fuso de quem
 * esta olhando, e o servidor no Render roda em outro.
 */
function lerInstante(valor: unknown, nome: string): Date {
  const texto = typeof valor === "string" ? valor : "";
  const data = new Date(texto);

  if (texto.length === 0 || Number.isNaN(data.getTime())) {
    throw new ErroHttp(
      400,
      `Parametro "${nome}" invalido: informe uma data ISO 8601 ` +
        `(ex.: 2026-11-16T03:00:00.000Z).`
    );
  }
  return data;
}

/** GET /tarefas?inicio=<ISO>&fim=<ISO> */
export async function listar(req: Request, res: Response): Promise<void> {
  const { sub } = usuarioDoPedido(req);

  const inicio = lerInstante(req.query.inicio, "inicio");
  const fim = lerInstante(req.query.fim, "fim");

  if (fim <= inicio) {
    throw new ErroHttp(400, `"fim" precisa ser depois de "inicio".`);
  }

  const dias = (fim.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000);
  if (dias > PERIODO_MAXIMO_DIAS) {
    throw new ErroHttp(
      400,
      `Periodo grande demais: o maximo e ${PERIODO_MAXIMO_DIAS} dias.`
    );
  }

  const tarefas = await tarefasRepository.listarPorPeriodo(sub, inicio, fim);
  res.json({ tarefas });
}
