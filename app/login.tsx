import { View, Text, TouchableOpacity, Image, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import * as Auth from "@/lib/_core/auth";
import { useColors } from "@/hooks/use-colors";

export default function LoginScreen() {
  const { isAuthenticated, loading, refresh } = useAuth();
  const [accessCode, setAccessCode] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const colors = useColors();

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
      
      // Access codes
      const adminCode = "IGREJA2024";
      const volunteerCode = "VOLUNTARIO2024";
      
      const code = accessCode.toUpperCase();
      let user: Auth.User;
      
      if (code === adminCode) {
        // Admin user
        user = {
          id: 1,
          openId: `admin-${Date.now()}`,
          name: "Administrador",
          email: "admin@igreja.com",
          loginMethod: "access_code",
          lastSignedIn: new Date(),
        };
        await Auth.setSessionToken("access-token-admin-" + Date.now());
      } else if (code === volunteerCode) {
        // Volunteer user
        user = {
          id: 2,
          openId: `volunteer-${Date.now()}`,
          name: "Voluntário",
          email: "voluntario@igreja.com",
          loginMethod: "access_code",
          lastSignedIn: new Date(),
        };
        await Auth.setSessionToken("access-token-volunteer-" + Date.now());
      } else {
        Alert.alert("Erro", "Código de acesso inválido");
        setLoginLoading(false);
        return;
      }
      
      // Store user info
      await Auth.setUserInfo(user);
      
      // Refresh auth state
      await refresh();
      
      // Navigate to home
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Erro", "Falha ao fazer login");
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
          className="w-32 h-32"
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
