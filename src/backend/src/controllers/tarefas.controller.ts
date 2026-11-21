/**
 * Tarefas (os "Prazzos") do usuario logado.
 *
 *   GET   /tarefas?inicio=&fim=   agenda do periodo
 *   POST  /tarefas                cria uma tarefa
 *   PATCH /tarefas/:id/status     conclui ou reabre
 */
import type { Request, Response } from "express";

import { usuarioDoPedido } from "../middlewares/autenticacao";
import { ErroHttp } from "../middlewares/erros";
import { disciplinasRepository } from "../repositories/disciplinas.repository";
import { tarefasRepository } from "../repositories/tarefas.repository";
import type { TarefaPrioridade, TarefaTipo } from "../types";

/**
 * Teto do periodo de uma consulta. A agenda pede uma semana; o limite so
 * impede que um cliente peca "todas as tarefas desde 1970" numa chamada.
 */
const PERIODO_MAXIMO_DIAS = 62;

const TITULO_MAX = 120;
const DESCRICAO_MAX = 500;

/** Mesmos valores dos ENUMs da migration 003. */
const TIPOS: readonly TarefaTipo[] = ["prova", "trabalho", "leitura", "entrega", "outro"];
const PRIORIDADES: readonly TarefaPrioridade[] = ["urgente", "normal"];

/** Formato de um uuid. Sem esta checagem, um id malformado vira erro 500 no pg. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Campos que o app usa para marcar o erro embaixo do campo do formulario. */
type ErrosDeCampo = Partial<
  Record<"titulo" | "descricao" | "tipo" | "prioridade" | "prazo" | "disciplinaId", string>
>;

/** `undefined` -> data invalida, para o chamador decidir a mensagem. */
function paraData(valor: unknown): Date | undefined {
  if (typeof valor !== "string" || valor.length === 0) return undefined;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? undefined : data;
}

/**
 * Le um instante ISO 8601 da query string.
 *
 * O app manda o inicio e o fim da semana ja no fuso do aparelho
 * (`segunda 00:00` local, convertido com `toISOString()`). Por isso a API nao
 * decide sozinha onde a semana comeca: "segunda-feira" depende do fuso de quem
 * esta olhando, e o servidor no Render roda em outro.
 */
function lerInstante(valor: unknown, nome: string): Date {
  const data = paraData(valor);
  if (!data) {
    throw new ErroHttp(
      400,
      `Parametro "${nome}" invalido: informe uma data ISO 8601 ` +
        `(ex.: 2026-11-16T03:00:00.000Z).`
    );
  }
  return data;
}

function lerId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string" || !UUID.test(id)) {
    throw new ErroHttp(404, "Tarefa nao encontrada.");
  }
  return id;
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

/**
 * POST /tarefas
 * { titulo, descricao?, tipo, prioridade, prazo (ISO), disciplinaId? }
 */
export async function criar(req: Request, res: Response): Promise<void> {
  const { sub } = usuarioDoPedido(req);
  const corpo = (req.body ?? {}) as Record<string, unknown>;

  const titulo = typeof corpo.titulo === "string" ? corpo.titulo.trim() : "";
  const descricaoBruta =
    typeof corpo.descricao === "string" ? corpo.descricao.trim() : "";
  const tipo = corpo.tipo as TarefaTipo;
  const prioridade = (corpo.prioridade ?? "normal") as TarefaPrioridade;
  const prazo = paraData(corpo.prazo);
  const disciplinaId =
    typeof corpo.disciplinaId === "string" && corpo.disciplinaId.length > 0
      ? corpo.disciplinaId
      : null;

  const campos: ErrosDeCampo = {};

  if (titulo.length === 0) {
    campos.titulo = "Informe o titulo da tarefa.";
  } else if (titulo.length > TITULO_MAX) {
    campos.titulo = `O titulo pode ter ate ${TITULO_MAX} caracteres.`;
  }
  if (descricaoBruta.length > DESCRICAO_MAX) {
    campos.descricao = `A descricao pode ter ate ${DESCRICAO_MAX} caracteres.`;
  }
  if (!TIPOS.includes(tipo)) {
    campos.tipo = "Escolha o tipo da tarefa.";
  }
  if (!PRIORIDADES.includes(prioridade)) {
    campos.prioridade = "Prioridade invalida.";
  }
  if (!prazo) {
    campos.prazo = "Informe o dia e o horario do prazo.";
  }
  if (disciplinaId !== null) {
    // Disciplina de outro usuario e tratada como inexistente.
    const valida =
      UUID.test(disciplinaId) &&
      (await disciplinasRepository.pertenceAoUsuario(sub, disciplinaId));
    if (!valida) {
      campos.disciplinaId = "Disciplina nao encontrada.";
    }
  }

  if (Object.keys(campos).length > 0 || !prazo) {
    throw new ErroHttp(400, "Dados invalidos.", campos);
  }

  const tarefa = await tarefasRepository.criar({
    usuarioId: sub,
    disciplinaId,
    titulo,
    descricao: descricaoBruta.length > 0 ? descricaoBruta : null,
    tipo,
    prioridade,
    prazo,
  });

  res.status(201).json({ tarefa });
}

/** PATCH /tarefas/:id/status   { status: "concluida" | "pendente" } */
export async function alterarStatus(req: Request, res: Response): Promise<void> {
  const { sub } = usuarioDoPedido(req);
  const id = lerId(req);
  const status = (req.body ?? {}).status;

  if (status !== "concluida" && status !== "pendente") {
    throw new ErroHttp(400, `"status" deve ser "concluida" ou "pendente".`);
  }

  const tarefa = await tarefasRepository.alterarStatus(
    sub,
    id,
    status === "concluida"
  );

  // Inexistente ou de outro usuario: mesma resposta, sem revelar qual.
  if (!tarefa) {
    throw new ErroHttp(404, "Tarefa nao encontrada.");
  }

  res.json({ tarefa });
}
