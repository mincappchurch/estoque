import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function AddTeamScreen() {
  const router = useRouter();
  const colors = useColors();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.teams.create.useMutation({
    onSuccess: async () => {
      await utils.teams.list.invalidate();
      Alert.alert("Sucesso", "Time cadastrado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert("Erro", error.message);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Informe o nome do time");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
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
            disabled={createMutation.isPending}
            style={{
              backgroundColor: createMutation.isPending ? "#9ca3af" : colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 8,
              opacity: createMutation.isPending ? 0.5 : 1,
            }}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                Cadastrar Time
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
