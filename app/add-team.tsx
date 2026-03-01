import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export default function AddTeamScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Informe o nome do time");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("teams").insert({
        name: name.trim(),
        description: description.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert("Sucesso", "Time cadastrado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao cadastrar time");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 px-6 pt-6">
        <View className="flex-row items-center gap-4 mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name="arrow.left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Novo Time</Text>
          </View>
        </View>

        {loading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !isAdmin ? (
          <View className="bg-surface rounded-xl p-4 border border-warning/40">
            <Text className="text-warning font-medium">Acesso restrito</Text>
            <Text className="text-sm text-muted mt-1">
              Apenas administrador pode cadastrar time.
            </Text>
          </View>
        ) : (
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Nome do Time *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Recepção"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: colors.foreground,
              }}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Descrição (Opcional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descrição do time"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: colors.foreground,
                minHeight: 100,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? "#9ca3af" : colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 8,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                Cadastrar Time
              </Text>
            )}
          </TouchableOpacity>
        </View>
        )}
      </View>
    </ScreenContainer>
  );
}
