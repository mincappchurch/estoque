import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { router } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export default function BackupScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handleExportBackup = async () => {
    try {
      setLoading(true);

      const [categoriesRes, teamsRes, unitsRes, productsRes, movementsRes] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("teams").select("*"),
        supabase.from("units").select("*"),
        supabase.from("products").select("*"),
        supabase.from("movements").select("*"),
      ]);

      if (categoriesRes.error || teamsRes.error || unitsRes.error || productsRes.error || movementsRes.error) {
        Alert.alert("Erro", "Não foi possível gerar o backup");
        return;
      }

      const backupData = {
        timestamp: new Date().toISOString(),
        data: {
          categories: categoriesRes.data ?? [],
          teams: teamsRes.data ?? [],
          units: unitsRes.data ?? [],
          products: productsRes.data ?? [],
          movements: movementsRes.data ?? [],
        },
      };

      // Save backup to AsyncStorage
      const backupKey = `backup_${new Date().toISOString()}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(backupData));

      Alert.alert(
        "Backup Criado",
        `Backup salvo com sucesso!\\n\\nData: ${new Date().toLocaleString('pt-BR')}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Erro", "Falha ao criar backup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 active:opacity-70"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">
            Backup de Dados
          </Text>
        </View>

        {/* Info Card */}
        <View className="bg-primary/10 rounded-xl p-4 mb-6">
          <View className="flex-row items-start gap-3">
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-sm text-foreground leading-relaxed">
                Faça backup regular dos seus dados para evitar perda de informações.
                O backup inclui todos os produtos, categorias, times e movimentações.
              </Text>
            </View>
          </View>
        </View>

        {/* Export Backup */}
        <View className="bg-surface rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-3">
            <IconSymbol name="arrow.up.doc.fill" size={24} color={colors.success} />
            <Text className="text-lg font-semibold text-foreground ml-3">
              Criar Backup
            </Text>
          </View>
          <Text className="text-sm text-muted mb-4">
            Crie um backup completo de todos os dados do sistema
          </Text>
          <TouchableOpacity
            onPress={handleExportBackup}
            disabled={loading}
            className="bg-success rounded-lg p-3 active:opacity-80"
          >
            <Text className="text-white text-center font-semibold">
              {loading ? "Criando..." : "Criar Backup Agora"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info about automatic backup */}
        <View className="bg-surface rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
            <Text className="text-base font-semibold text-foreground ml-2">
              Backup Automático Ativo
            </Text>
          </View>
          <Text className="text-sm text-muted">
            Seus dados são automaticamente sincronizados com a nuvem quando você está conectado à internet.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
