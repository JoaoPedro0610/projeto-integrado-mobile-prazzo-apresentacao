/**
 * PRAZZO - componente raiz do app.
 *
 * Responsabilidades: providers globais (safe area e sessao do usuario) e o
 * navegador raiz. A regra e manter este arquivo enxuto: tela nenhuma mora aqui.
 */
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/contexts/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* Fundo escuro em todo o app -> icones claros na barra de status. */}
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
