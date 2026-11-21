/**
 * Monta a agenda da semana (segunda a sexta) a partir das tarefas da API.
 *
 * Os tipos `Task` e `AgendaDay` sao os mesmos da ETAPA 3, quando as tarefas
 * eram fixas neste arquivo: por isso `TaskCard`, `Tag` e o calendario do
 * Dashboard nao precisaram mudar para passar a ler do backend.
 */
import type { TarefaApi, TarefaTipo } from "../services/tarefas";

/** Define a cor da etiqueta no card da tarefa. */
export type TaskPriority = "urgent" | "normal";

export type Task = {
  id: string;
  /** Etiqueta curta exibida no topo do card ("Prova", "Leitura", "Concluido"). */
  tag: string;
  priority: TaskPriority;
  title: string;
  /** Horario ja formatado ("Ate 23:59", "As 19:00", "Concluido as 14:00"). */
  time: string;
  /** Nome da disciplina, quando a tarefa pertence a uma. */
  subject: string | null;
  /** Concluida: o card mostra a caixa marcada e o titulo esmaecido. */
  done: boolean;
};

export type AgendaDay = {
  id: string;
  /** Abreviacao no calendario ("Seg", "Ter"...). */
  shortName: string;
  /** Nome completo no titulo da lista ("Terca-feira"). */
  fullName: string;
  dayNumber: number;
  /** Marca o dia atual para o calendario ja abrir selecionado nele. */
  isToday: boolean;
  tasks: Task[];
};

const WEEKDAYS = [
  { short: "Seg", full: "Segunda-feira" },
  { short: "Ter", full: "Terca-feira" },
  { short: "Qua", full: "Quarta-feira" },
  { short: "Qui", full: "Quinta-feira" },
  { short: "Sex", full: "Sexta-feira" },
] as const;

/** Texto da etiqueta para cada tipo de tarefa do backend. */
const TIPO_LABEL: Record<TarefaTipo, string> = {
  prova: "Prova",
  trabalho: "Trabalho",
  leitura: "Leitura",
  entrega: "Entrega",
  outro: "Compromisso",
};

/**
 * Segunda-feira (00:00, hora local) da semana da data informada.
 * `getDay()` devolve 0 no domingo, entao no domingo apontamos para a
 * segunda seguinte (a semana que o aluno tem pela frente). O seed do backend
 * usa a mesma regra.
 */
function mondayOfWeek(reference: Date): Date {
  const weekday = reference.getDay();
  const offset = weekday === 0 ? 1 : 1 - weekday;

  const monday = new Date(reference);
  monday.setDate(reference.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Periodo que a agenda mostra: de segunda 00:00 ate sabado 00:00, no fuso do
 * aparelho. E o que vai para `GET /tarefas?inicio=...&fim=...`.
 */
export function agendaWeekRange(reference: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const start = mondayOfWeek(reference);
  const end = new Date(start);
  end.setDate(start.getDate() + WEEKDAYS.length);
  return { start, end };
}

function hhmm(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Converte a tarefa da API no formato que o `TaskCard` desenha. */
function toTask(tarefa: TarefaApi): Task {
  const concluida = tarefa.status === "concluida";
  const prazo = new Date(tarefa.prazo);

  let time: string;
  if (concluida) {
    time = `Concluido as ${hhmm(new Date(tarefa.concluidaEm ?? tarefa.prazo))}`;
  } else if (tarefa.tipo === "entrega") {
    time = `Ate ${hhmm(prazo)}`;
  } else {
    time = `As ${hhmm(prazo)}`;
  }

  return {
    id: tarefa.id,
    // Concluida perde o destaque de urgente: ja nao exige atencao.
    tag: concluida ? "Concluido" : TIPO_LABEL[tarefa.tipo],
    priority: !concluida && tarefa.prioridade === "urgente" ? "urgent" : "normal",
    title: tarefa.titulo,
    time,
    subject: tarefa.disciplinaNome,
    done: concluida,
  };
}

/** Os cinco dias uteis da semana da agenda, para o formulario de nova tarefa. */
export function agendaWeekDays(
  reference: Date = new Date()
): { label: string; date: Date }[] {
  const { start: monday } = agendaWeekRange(reference);

  return WEEKDAYS.map((weekday, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { label: `${weekday.short} ${date.getDate()}`, date };
  });
}

/**
 * Monta a semana (segunda a sexta) em torno da data atual e distribui as
 * tarefas pelo dia LOCAL do prazo. A API ja devolve tudo em ordem de prazo,
 * entao cada dia sai ordenado por horario.
 */
export function buildAgendaWeek(
  tarefas: TarefaApi[] = [],
  reference: Date = new Date()
): AgendaDay[] {
  const { start: monday } = agendaWeekRange(reference);

  return WEEKDAYS.map((weekday, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateKey = date.toDateString();

    return {
      id: weekday.short,
      shortName: weekday.short,
      fullName: weekday.full,
      dayNumber: date.getDate(),
      isToday: dateKey === reference.toDateString(),
      tasks: tarefas
        .filter((tarefa) => new Date(tarefa.prazo).toDateString() === dateKey)
        .map(toTask),
    };
  });
}
