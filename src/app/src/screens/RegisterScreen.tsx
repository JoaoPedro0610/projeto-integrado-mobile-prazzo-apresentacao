/**
 * Tela de cadastro (rota "Register").
 *
 * Cria a conta pela API (POST /auth/registrar, via `useAuth().registrar`).
 * O backend e quem recusa um RA ou e-mail que ja existe - a validacao daqui
 * e apenas a primeira barreira, para o usuario nao esperar uma ida ao
 * servidor por um erro obvio. Os erros por campo que a API devolve aparecem
 * embaixo do Input correspondente.
 */
import { useState } from "react";
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

import { Button, Input } from "../components";
import { useAuth } from "../contexts/AuthContext";
import type { RootStackScreenProps } from "../navigation/types";
import { ApiError } from "../services/api";
import { colors, radius, shadow, spacing, textStyles } from "../theme";

const RA_MIN_LENGTH = 6;
const PASSWORD_MIN_LENGTH = 6;
/** Checagem simples de e-mail: algo@algo.algo */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = {
  name?: string;
  ra?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
};

export function RegisterScreen({
  navigation,
}: RootStackScreenProps<"Register">) {
  const [name, setName] = useState("");
  const [ra, setRa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  /** Erro que nao e de um campo so: sem rede, servidor fora. */
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { registrar } = useAuth();

  async function handleSubmit() {
    if (loading) {
      return;
    }

    const nextErrors: FormErrors = {};

    if (name.trim().length < 3) {
      nextErrors.name = "Informe o seu nome completo.";
    }

    if (ra.length < RA_MIN_LENGTH) {
      nextErrors.ra = `O RA deve ter ao menos ${RA_MIN_LENGTH} digitos.`;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = "Informe um e-mail valido.";
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      nextErrors.password = `A senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }

    if (passwordConfirmation !== password) {
      nextErrors.passwordConfirmation = "As senhas nao conferem.";
    }

    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await registrar({
        nome: name.trim(),
        ra,
        email: email.trim(),
        senha: password,
      });
    } catch (erro) {
      setLoading(false);
      if (erro instanceof ApiError) {
        // A API responde com as chaves em portugues; o formulario usa as do app.
        const { nome, ra: erroRa, email: erroEmail, senha } = erro.campos;
        setErrors({ name: nome, ra: erroRa, email: erroEmail, password: senha });
        if (!nome && !erroRa && !erroEmail && !senha) {
          setFormError(erro.message);
        }
      } else {
        setFormError("Algo deu errado. Tente de novo.");
      }
      return;
    }

    // A API ja devolve o token no cadastro: entra direto, sem pedir login.
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
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
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>
              Comece a organizar os seus prazos academicos
            </Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Nome completo"
              value={name}
              onChangeText={setName}
              error={errors.name}
              placeholder="Ex: Maria Silva"
              autoCapitalize="words"
            />

            <Input
              label="RA"
              value={ra}
              onChangeText={(value) => setRa(value.replace(/[^0-9]/g, ""))}
              error={errors.ra}
              placeholder="Ex: 12345678"
              keyboardType="number-pad"
              maxLength={8}
            />

            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="voce@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              placeholder="Minimo de 6 caracteres"
              secureTextEntry
            />

            <Input
              label="Confirmar senha"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              error={errors.passwordConfirmation}
              placeholder="Repita a senha"
              secureTextEntry
              onSubmitEditing={handleSubmit}
            />

            {formError ? (
              <Text style={styles.formError} accessibilityLiveRegion="polite">
                {formError}
              </Text>
            ) : null}

            <Button label="CRIAR CONTA" onPress={handleSubmit} loading={loading} />
          </View>

          {/* `navigate` e nao `goBack`: se o usuario chegou aqui pela Welcome,
              voltar levaria para a Welcome, e nao para o Login que o texto
              promete. Com `navigate`, o stack volta para o Login quando ele
              ja existe e o abre quando nao existe. */}
          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={styles.footerLink}
          >
            <Text style={styles.footerText}>
              Ja tem conta? <Text style={styles.footerStrongText}>Entrar</Text>
            </Text>
          </Pressable>
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
    justifyContent: "center",
    padding: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxl,
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
  formError: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  footerLink: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
  footerText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  footerStrongText: {
    color: colors.primaryLight,
    fontWeight: "700",
  },
});
