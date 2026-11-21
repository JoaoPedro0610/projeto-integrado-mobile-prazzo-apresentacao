/**
 * Formulario de nova tarefa (rota "NewTask"), aberto pelo "+ Novo Prazzo".
 *
 * O dia e escolhido entre os cinco da semana que a agenda mostra: uma tarefa
 * em outra semana nao apareceria em lugar nenhum do app. O horario e digitado
 * (HH:MM) para nao depender de um seletor de data nativo.
 *
 * Ao salvar, volta para o Dashboard, que recarrega a agenda quando ganha foco.
 */
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Chip, Input } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { agendaWeekDays } from "../data/agenda";
import type { RootStackScreenProps } from "../navigation/types";
import { ApiError } from "../services/api";
import {
  criarTarefa,
  listarDisciplinas,
  type DisciplinaApi,
  type TarefaPrioridade,
  type TarefaTipo,
} from "../services/tarefas";
import { colors, radius, shadow, spacing, textStyles } from "../theme";

const TIPOS: { value: TarefaTipo; label: string }[] = [
  { value: "prova", label: "Prova" },
  { value: "trabalho", label: "Trabalho" },
  { value: "entrega", label: "Entrega" },
  { value: "leitura", label: "Leitura" },
  { value: "outro", label: "Compromisso" },
];

const HORA_PADRAO = /^([01]\d|2[0-3]):[0-5]\d$/;

type FormErrors = {
  title?: string;
  description?: string;
  type?: string;
  time?: string;
  subject?: string;
};

/** Mantem so digitos e insere os dois-pontos: "1930" -> "19:30". */
function mascararHora(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 4);
  return digitos.length <= 2 ? digitos : `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

export function NewTaskScreen({ navigation, route }: RootStackScreenProps<"NewTask">) {
  const { token } = useAuth();
  const [dias] = useState(() => agendaWeekDays());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TarefaTipo | null>(null);
  const [priority, setPriority] = useState<TarefaPrioridade>("normal");
  const [dayIndex, setDayIndex] = useState(() =>
    Math.min(Math.max(route.params.dayIndex, 0), dias.length - 1)
  );
  const [time, setTime] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const [disciplinas, setDisciplinas] = useState<DisciplinaApi[] | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Falha aqui nao bloqueia o formulario: a tarefa pode ser criada sem
    // disciplina.
    listarDisciplinas(token)
      .then(setDisciplinas)
      .catch(() => setDisciplinas([]));
  }, [token]);

  async function handleSubmit() {
    if (loading || !token) {
      return;
    }

    const nextErrors: FormErrors = {};
    if (title.trim().length === 0) {
      nextErrors.title = "Informe o titulo da tarefa.";
    }
    if (!type) {
      nextErrors.type = "Escolha o tipo da tarefa.";
    }
    if (!HORA_PADRAO.test(time)) {
      nextErrors.time = "Informe o horario no formato HH:MM (ex.: 19:30).";
    }

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0 || !type) {
      return;
    }

    const [hora, minuto] = time.split(":").map(Number);
    const prazo = new Date(dias[dayIndex].date);
    prazo.setHours(hora, minuto, 0, 0);

    setLoading(true);
    try {
      await criarTarefa(token, {
        titulo: title.trim(),
        descricao: description.trim() || undefined,
        tipo: type,
        prioridade: priority,
        prazo,
        disciplinaId: subjectId,
      });
    } catch (erro) {
      setLoading(false);
      if (erro instanceof ApiError) {
        const c = erro.campos;
        setErrors({
          title: c.titulo,
          description: c.descricao,
          type: c.tipo,
          time: c.prazo,
          subject: c.disciplinaId,
        });
        if (Object.keys(c).length === 0) {
          setFormError(erro.message);
        }
      } else {
        setFormError("Algo deu errado. Tente de novo.");
      }
      return;
    }

    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              hitSlop={12}
            >
              <Text style={styles.back}>Cancelar</Text>
            </Pressable>
            <Text style={styles.title}>Novo Prazzo</Text>
            <Text style={styles.subtitle}>
              Cadastre uma prova, entrega ou compromisso da semana
            </Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Titulo"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
              placeholder="Ex: Entrega do relatorio de BD"
              maxLength={120}
            />

            <Input
              label="Descricao (opcional)"
              value={description}
              onChangeText={setDescription}
              error={errors.description}
              placeholder="Detalhes, sala, o que levar..."
              maxLength={500}
              multiline
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.chips}>
              {TIPOS.map((opcao) => (
                <Chip
                  key={opcao.value}
                  label={opcao.label}
                  selected={type === opcao.value}
                  onPress={() => setType(opcao.value)}
                />
              ))}
            </View>
            {errors.type ? <Text style={styles.error}>{errors.type}</Text> : null}

            <Text style={styles.label}>Prioridade</Text>
            <View style={styles.chips}>
              <Chip
                label="Normal"
                selected={priority === "normal"}
                onPress={() => setPriority("normal")}
              />
              <Chip
                label="Urgente"
                danger
                selected={priority === "urgente"}
                onPress={() => setPriority("urgente")}
              />
            </View>

            <Text style={styles.label}>Dia</Text>
            <View style={styles.chips}>
              {dias.map((dia, index) => (
                <Chip
                  key={dia.label}
                  label={dia.label}
                  selected={dayIndex === index}
                  onPress={() => setDayIndex(index)}
                />
              ))}
            </View>

            <Input
              label="Horario"
              value={time}
              onChangeText={(valor) => setTime(mascararHora(valor))}
              error={errors.time}
              placeholder="Ex: 23:59"
              keyboardType="number-pad"
              maxLength={5}
            />

            <Text style={styles.label}>Disciplina</Text>
            <View style={styles.chips}>
              <Chip
                label="Nenhuma"
                selected={subjectId === null}
                onPress={() => setSubjectId(null)}
              />
              {(disciplinas ?? []).map((disciplina) => (
                <Chip
                  key={disciplina.id}
                  label={disciplina.nome}
                  selected={subjectId === disciplina.id}
                  onPress={() => setSubjectId(disciplina.id)}
                />
              ))}
            </View>
            {disciplinas === null ? (
              <Text style={styles.hint}>Carregando disciplinas...</Text>
            ) : null}
            {errors.subject ? (
              <Text style={styles.error}>{errors.subject}</Text>
            ) : null}

            {formError ? (
              <Text style={styles.formError} accessibilityLiveRegion="polite">
                {formError}
              </Text>
            ) : null}

            <Button
              label="SALVAR PRAZZO"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  back: {
    ...textStyles.label,
    color: colors.primaryLight,
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.title,
    fontSize: 26,
    color: colors.textHeading,
  },
  subtitle: {
    ...textStyles.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  label: {
    ...textStyles.label,
    color: colors.textLabel,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  error: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  hint: {
    ...textStyles.subtitle,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  formError: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
