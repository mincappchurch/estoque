import { View, Text, TouchableOpacity, Image, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import * as Auth from "@/lib/_core/auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function LoginScreen() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [accessCode, setAccessCode] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const colors = useColors();
  const loginMutation = trpc.auth.loginWithCode.useMutation();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!accessCode.trim()) {
      Alert.alert("Erro", "Por favor, insira o código de acesso");
      return;
    }

    try {
      setLoginLoading(true);
      const result = await loginMutation.mutateAsync({
        code: accessCode,
      });

      await Auth.setSessionToken(result.token);

      const user: Auth.User = {
        id: result.user.id,
        openId: result.user.openId ?? `access-code-${result.user.id}`,
        name: result.user.name ?? "Usuário",
        email: result.user.email ?? null,
        loginMethod: result.user.loginMethod ?? "access_code",
        lastSignedIn: result.user.lastSignedIn ? new Date(result.user.lastSignedIn) : new Date(),
      };
      
      // Store user info
      await Auth.setUserInfo(user);
      
      // Refresh auth state
      await refresh();
      
      // Navigate to home
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Erro", "Código inválido ou falha ao fazer login");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Carregando...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="items-center justify-center p-6">
      <View className="w-full max-w-sm items-center gap-8">
        {/* Logo */}
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 72, height: 72 }}
          resizeMode="contain"
        />

        {/* Title */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">
            MINC STOCK
          </Text>
          <Text className="text-base text-muted text-center">
            Sistema de gerenciamento de insumos
          </Text>
        </View>

        {/* Access Code Input */}
        <View className="w-full gap-3">
          <Text className="text-sm font-medium text-foreground">
            Código de Acesso
          </Text>
          <TextInput
            value={accessCode}
            onChangeText={setAccessCode}
            placeholder="Digite o código de acesso"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            className="w-full bg-surface border-2 border-border rounded-xl px-4 py-3 text-foreground text-base"
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loginLoading}
          className="w-full bg-primary px-6 py-4 rounded-xl active:opacity-80"
        >
          <Text className="text-white text-center font-semibold text-lg">
            {loginLoading ? "Entrando..." : "Entrar"}
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <View className="bg-primary/10 rounded-xl p-4 w-full">
          <Text className="text-sm text-foreground text-center leading-relaxed">
            Entre em contato com o administrador para obter o código de acesso
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
