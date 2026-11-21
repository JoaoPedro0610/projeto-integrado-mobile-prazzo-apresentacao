/**
 * Card de uma tarefa na agenda.
 *
 * Equivale ao `.task-card` do prototipo: etiqueta, titulo e a linha de
 * horario + disciplina, empilhados dentro de um cartao com borda suave.
 * So texto, sem emoji: o glifo do relogio variava de fabricante para
 * fabricante e destoava do resto da interface.
 *
 * A caixa a direita conclui/reabre a tarefa. Ela e o unico alvo de toque do
 * card de proposito: rolar a lista e encostar no card nao pode concluir nada
 * sem querer.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Tag } from "./Tag";
import type { Task } from "../data/agenda";
import { colors, radius, spacing, textStyles } from "../theme";

type TaskCardProps = {
  task: Task;
  /** Sem callback, a caixa nao aparece (card so de leitura). */
  onToggleDone?: (task: Task) => void;
};

export function TaskCard({ task, onToggleDone }: TaskCardProps) {
  return (
    <View style={[styles.card, task.done && styles.cardDone]}>
      <View style={styles.content}>
        <Tag label={task.tag} priority={task.priority} />
        <Text style={[styles.title, task.done && styles.titleDone]}>
          {task.title}
        </Text>
        <Text style={styles.time}>
          {task.subject ? `${task.time}  ·  ${task.subject}` : task.time}
        </Text>
      </View>

      {onToggleDone ? (
        <Pressable
          onPress={() => onToggleDone(task)}
          // Area de toque maior que o desenho: 26px e pouco para o dedo.
          hitSlop={12}
          style={[styles.check, task.done && styles.checkDone]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.done }}
          accessibilityLabel={
            task.done
              ? `Reabrir a tarefa ${task.title}`
              : `Concluir a tarefa ${task.title}`
          }
        >
          {/* Marca desenhada com bordas, sem depender de fonte de icones. */}
          {task.done ? <View style={styles.checkMark} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardDone: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  titleDone: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  time: {
    ...textStyles.subtitle,
    fontSize: 11,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderInput,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkMark: {
    width: 7,
    height: 12,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: colors.black,
    transform: [{ rotate: "45deg" }],
    marginTop: -3,
  },
});
