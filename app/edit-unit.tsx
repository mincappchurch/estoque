import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function EditUnitScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string }>();
  const unitId = parseInt(params.id);

  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");

  const { data: units, isLoading } = trpc.units.list.useQuery();
  const unit = units?.find(u => u.id === unitId);
  const deleteMutation = trpc.units.delete.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setAbbreviation(unit.abbreviation);
    }
  }, [unit]);



  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir a unidade "${name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id: unitId });
              await utils.units.list.invalidate();
              Alert.alert("Sucesso", "Unidade excluída com sucesso!", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a unidade");
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
            <Text className="text-2xl font-bold text-foreground">Editar Unidade</Text>
          </View>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Nome da Unidade *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Litro"
              placeholderTextColor={colors.muted}
              editable={false}
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
            <Text className="text-sm font-medium text-foreground mb-2">Abreviação *</Text>
            <TextInput
              value={abbreviation}
              onChangeText={setAbbreviation}
              placeholder="Ex: L"
              placeholderTextColor={colors.muted}
              editable={false}
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
                  Excluir Unidade
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
