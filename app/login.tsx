import { View, Text, TouchableOpacity, Image, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import * as Auth from "@/lib/_core/auth";
import { useColors } from "@/hooks/use-colors";
import { supabase } from "@/lib/supabase";

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
      const normalizedCode = accessCode.trim().toUpperCase();

      const { data, error } = await supabase.rpc("fn_use_access_code", {
        p_plain_code: normalizedCode,
      });

      if (error || !Array.isArray(data) || data.length === 0) {
        throw new Error(error?.message || "Código de acesso inválido");
      }

      const accessCodeResult = data[0] as {
        access_code_id: string;
        label: string;
        role: "admin" | "volunteer" | "team_leader";
      };

      if (!accessCodeResult?.access_code_id) {
        throw new Error("Código de acesso inválido");
      }

      const openId = `access-code-${accessCodeResult.access_code_id}`;
      const nowIso = new Date().toISOString();

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .upsert(
          {
            open_id: openId,
            name: accessCodeResult.label,
            email: null,
            login_method: "access_code",
            role: accessCodeResult.role,
            last_signed_in: nowIso,
          },
          { onConflict: "open_id" },
        )
        .select("id, name, role")
        .single();

      if (userError || !userRecord?.id) {
        throw new Error(userError?.message || "Falha ao carregar usuário");
      }

      const token = `access-token-${userRecord.id}`;

      await Auth.setSessionToken(token);

      const user: Auth.User = {
        id: userRecord.id,
        openId,
        name: userRecord.name ?? accessCodeResult.label ?? "Usuário",
        email: null,
        loginMethod: "access_code",
        role: (userRecord.role as Auth.User["role"]) ?? accessCodeResult.role,
        lastSignedIn: new Date(),
      };
      
      // Store user info
      await Auth.setUserInfo(user);
      
      // Refresh auth state
      await refresh();
      
      // Navigate to home
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Código inválido ou falha ao fazer login";
      Alert.alert("Erro", message);
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
