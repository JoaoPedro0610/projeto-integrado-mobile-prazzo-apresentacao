/**
 * Opcao selecionavel em formato de pilula, para escolhas curtas
 * (tipo, prioridade, dia, disciplina) no formulario de tarefa.
 */
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, textStyles } from "../theme";

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Selecao em vermelho (usado em "Urgente"). */
  danger?: boolean;
};

export function Chip({ label, selected, onPress, danger = false }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected && (danger ? styles.selectedDanger : styles.selected),
      ]}
    >
      <Text
        style={[
          styles.text,
          selected && (danger ? styles.textDanger : styles.textSelected),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceTinted,
  },
  selectedDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
  },
  text: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  textSelected: {
    color: colors.primaryLight,
  },
  textDanger: {
    color: colors.danger,
  },
});
