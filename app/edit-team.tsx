import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function EditTeamScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string }>();
  const teamId = params.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: team, isLoading } = trpc.teams.getById.useQuery({ id: teamId });
  const updateMutation = trpc.teams.update.useMutation();
  const deleteMutation = trpc.teams.delete.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || "");
    }
  }, [team]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "O nome do time é obrigatório");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: teamId,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Invalidate queries to refresh data
      await utils.teams.list.invalidate();
      
      Alert.alert("Sucesso", "Time atualizado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o time");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o time "${name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id: teamId });
              await utils.teams.list.invalidate();
              Alert.alert("Sucesso", "Time excluído com sucesso!", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o time");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 px-6 pt-6">
        {/* Header */}
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
            <Text className="text-2xl font-bold text-foreground">Editar Time</Text>
          </View>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Nome do Time *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Louvor Manhã"
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
              placeholder="Adicione uma descrição..."
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

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={{
              backgroundColor: updateMutation.isPending ? "#9ca3af" : "#FF6B00",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 8,
              opacity: updateMutation.isPending ? 0.5 : 1,
            }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                Salvar Alterações
              </Text>
            )}
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            style={{
              backgroundColor: deleteMutation.isPending ? "#9ca3af" : "#dc2626",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: deleteMutation.isPending ? 0.5 : 1,
            }}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <IconSymbol name="trash.fill" size={20} color="white" />
                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                  Excluir Time
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
