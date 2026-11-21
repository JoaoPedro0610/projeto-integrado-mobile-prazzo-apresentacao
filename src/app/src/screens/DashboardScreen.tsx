/**
 * Area logada: a agenda de tarefas (rota "Dashboard").
 *
 * Estrutura, de cima para baixo:
 *   1. Header roxo com a marca, o titulo e o avatar (toque = sair)
 *   2. Faixa de calendario, segunda a sexta, com o dia selecionavel
 *   3. Lista das tarefas do dia escolhido
 *
 * As tarefas da semana vem da API (GET /tarefas) numa chamada so, ao abrir a
 * tela; trocar de dia so filtra o que ja chegou. Puxar a lista para baixo
 * busca de novo.
 */
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TaskCard } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { agendaWeekRange, buildAgendaWeek, type Task } from "../data/agenda";
import type { RootStackScreenProps } from "../navigation/types";
import { ApiError } from "../services/api";
import {
  alterarStatusTarefa,
  listarTarefas,
  type TarefaApi,
} from "../services/tarefas";
import { brand, colors, radius, spacing, textStyles } from "../theme";

export function DashboardScreen({
  navigation,
}: RootStackScreenProps<"Dashboard">) {
  const insets = useSafeAreaInsets();
  const { usuario, token, sair } = useAuth();
  const inicial = usuario?.nome.trim().charAt(0).toUpperCase() || "?";

  const [tarefas, setTarefas] = useState<TarefaApi[]>([]);
  /** Primeira carga: mostra o spinner no lugar da lista. */
  const [carregando, setCarregando] = useState(true);
  /** Recarga pelo gesto de puxar: usa o spinner nativo do topo da lista. */
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** Falha ao concluir/reabrir: aviso curto acima da lista. */
  const [aviso, setAviso] = useState<string | null>(null);

  // Remontar a semana so quando as tarefas mudam, e nao a cada troca de dia.
  const week = useMemo(() => buildAgendaWeek(tarefas), [tarefas]);

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const todayIndex = week.findIndex((day) => day.isToday);
    return todayIndex >= 0 ? todayIndex : 0;
  });

  const selectedDay = week[selectedIndex];

  const handleLogout = useCallback(() => {
    sair();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }, [sair, navigation]);

  const carregarTarefas = useCallback(async () => {
    if (!token) {
      return;
    }

    setErro(null);
    try {
      const { start, end } = agendaWeekRange();
      setTarefas(await listarTarefas(token, start, end));
    } catch (falha) {
      // 401 = token vencido ou invalido: a sessao nao serve mais.
      if (falha instanceof ApiError && falha.status === 401) {
        handleLogout();
        return;
      }
      setErro(
        falha instanceof ApiError
          ? falha.message
          : "Nao foi possivel carregar as tarefas."
      );
    }
  }, [token, handleLogout]);

  // Carrega ao abrir E toda vez que a tela volta a ficar visivel - e assim que
  // a tarefa recem-criada no formulario aparece na agenda.
  useFocusEffect(
    useCallback(() => {
      carregarTarefas().finally(() => setCarregando(false));
    }, [carregarTarefas])
  );

  /**
   * Conclui/reabre de forma otimista: o card muda na hora e a API confirma
   * depois. Se a API recusar, o card volta ao estado anterior.
   */
  async function handleToggleDone(task: Task) {
    if (!token) return;

    const anterior = tarefas;
    const concluir = !task.done;
    setAviso(null);
    setTarefas((atuais) =>
      atuais.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: concluir ? "concluida" : "pendente",
              concluidaEm: concluir ? new Date().toISOString() : null,
            }
          : t
      )
    );

    try {
      const atualizada = await alterarStatusTarefa(token, task.id, concluir);
      setTarefas((atuais) =>
        atuais.map((t) => (t.id === atualizada.id ? atualizada : t))
      );
    } catch (falha) {
      if (falha instanceof ApiError && falha.status === 401) {
        handleLogout();
        return;
      }
      setTarefas(anterior);
      setAviso("Nao foi possivel atualizar a tarefa. Tente de novo.");
    }
  }

  async function handleRefresh() {
    setAtualizando(true);
    await carregarTarefas();
    setAtualizando(false);
  }

  function renderListaVazia() {
    if (carregando) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primaryLight} />
          <Text style={styles.emptyText}>Carregando as suas tarefas...</Text>
        </View>
      );
    }

    if (erro) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nao deu para carregar a agenda</Text>
          <Text style={styles.emptyText}>{erro}</Text>
          <Pressable
            onPress={() => {
              setCarregando(true);
              carregarTarefas().finally(() => setCarregando(false));
            }}
            accessibilityRole="button"
            style={styles.retry}
          >
            <Text style={styles.retryText}>Tentar de novo</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nenhum prazo para este dia</Text>
        <Text style={styles.emptyText}>Aproveite para descansar.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* O header e roxo escuro, entao os icones da barra de status
          precisam ser claros para continuarem legiveis. */}
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        {/* Marca compacta: o "P" sozinho. A 22px ele continua legivel,
            enquanto o calendario completo da Welcome viraria um borrao. */}
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/logo-p.png")}
            style={styles.brandMark}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={`Logo do ${brand.name}`}
          />
          <Text style={styles.appTitle}>{brand.name}</Text>
        </View>

        <View style={styles.userRow}>
          <Text style={styles.greeting}>Agenda Academica</Text>

          <Pressable
            onPress={handleLogout}
            style={styles.avatar}
            accessibilityRole="button"
            accessibilityLabel={
              usuario ? `Sair da conta de ${usuario.nome}` : "Sair da conta"
            }
          >
            <Text style={styles.avatarText}>{inicial}</Text>
          </Pressable>
        </View>

        <View style={styles.calendar}>
          {week.map((day, index) => {
            const isSelected = index === selectedIndex;

            return (
              <Pressable
                key={day.id}
                onPress={() => setSelectedIndex(index)}
                style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${day.fullName}, dia ${day.dayNumber}`}
              >
                <Text style={styles.dayName}>{day.shortName.toUpperCase()}</Text>
                <Text style={styles.dayNumber}>{day.dayNumber}</Text>

                {/* Bolinha so aparece nos dias que tem alguma tarefa. */}
                {day.tasks.length > 0 ? (
                  <View
                    style={[styles.dot, isSelected && styles.dotSelected]}
                  />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.tasksContainer}>
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>
            Tarefas de {selectedDay.fullName}
          </Text>
          <Pressable
            onPress={() =>
              navigation.navigate("NewTask", { dayIndex: selectedIndex })
            }
            accessibilityRole="button"
            accessibilityLabel="Criar nova tarefa"
            hitSlop={12}
          >
            <Text style={styles.newTaskLabel}>+ Novo Prazzo</Text>
          </Pressable>
        </View>

        {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

        <FlatList
          // Com erro, a lista fica vazia para a mensagem de erro aparecer.
          data={erro ? [] : selectedDay.tasks}
          keyExtractor={(task) => task.id}
          renderItem={({ item }) => (
            <TaskCard task={item} onToggleDone={handleToggleDone} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshing={atualizando}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderListaVazia()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    // Indigo profundo, nao o `primaryDark` do tema claro: aquele roxo vivo
    // ocupando um quinto da tela brigava com o fundo quase preto e ainda
    // achatava o contraste do dia selecionado dentro do calendario.
    // Para voltar ao header roxo forte, troque por `colors.primaryDark`.
    backgroundColor: colors.surfaceTinted,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  /** A arte tem proporcao 1.05 (1155x1213), mantida aqui. */
  brandMark: {
    width: 22,
    height: 23,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.primaryLight,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textOnPrimary,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },

  calendar: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  dayCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
  },
  dayName: {
    fontSize: 11,
    color: colors.textOnPrimary,
    opacity: 0.8,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textOnPrimary,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    marginTop: spacing.xs + 2,
  },
  dotSelected: {
    backgroundColor: colors.textOnPrimary,
  },
  /** Mantem a altura do card igual nos dias sem tarefa. */
  dotPlaceholder: {
    height: 5,
    marginTop: spacing.xs + 2,
  },

  tasksContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textHeading,
    flexShrink: 1,
  },
  newTaskLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryLight,
    marginLeft: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  aviso: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  retry: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: {
    ...textStyles.label,
    color: colors.primaryLight,
  },
});
