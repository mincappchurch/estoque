import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Role = "admin" | "volunteer" | "team_leader";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  volunteer: "Voluntário",
  team_leader: "Líder de Time",
};

export default function AccessCodesScreen() {
  const router = useRouter();
  const colors = useColors();
  const utils = trpc.useUtils();

  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<Role>("volunteer");

  const { data: accessCodes, isLoading } = trpc.auth.listAccessCodes.useQuery();

  const createMutation = trpc.auth.createAccessCode.useMutation({
    onSuccess: async () => {
      await utils.auth.listAccessCodes.invalidate();
      setLabel("");
      setCode("");
      setRole("volunteer");
      Alert.alert("Sucesso", "Usuário com código de acesso cadastrado com sucesso!");
    },
    onError: (error) => {
      Alert.alert("Erro", error.message);
    },
  });

  const sortedCodes = useMemo(() => {
    return [...(accessCodes ?? [])].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [accessCodes]);

  const handleCreate = () => {
    if (!label.trim()) {
      Alert.alert("Erro", "Informe o nome do usuário");
      return;
    }

    if (!code.trim() || code.trim().length < 4) {
      Alert.alert("Erro", "Informe um código com pelo menos 4 caracteres");
      return;
    }

    createMutation.mutate({
      label: label.trim(),
      code: code.trim().toUpperCase(),
      role,
    });
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row items-center gap-4">
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
              <Text className="text-2xl font-bold text-foreground">Usuários por Código</Text>
              <Text className="text-sm text-muted mt-1">Cadastrar usuário com código de acesso</Text>
            </View>
          </View>
        </View>

        <View className="px-6 pt-5 gap-3">
          <Text className="text-sm font-medium text-foreground">Nome do Usuário *</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Ex: João da Recepção"
            placeholderTextColor={colors.muted}
            className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
          />

          <Text className="text-sm font-medium text-foreground">Código de Acesso *</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Ex: JOAO2026"
            placeholderTextColor={colors.muted}
            className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
          />

          <Text className="text-sm font-medium text-foreground">Perfil *</Text>
          <View className="flex-row flex-wrap gap-2">
            {(["admin", "volunteer", "team_leader"] as Role[]).map((itemRole) => (
              <TouchableOpacity
                key={itemRole}
                onPress={() => setRole(itemRole)}
                className={`rounded-xl px-4 py-2 border ${
                  role === itemRole ? "bg-primary border-primary" : "bg-surface border-border"
                }`}
              >
                <Text className={role === itemRole ? "text-background font-medium" : "text-foreground"}>
                  {ROLE_LABEL[itemRole]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={createMutation.isPending}
            className="bg-primary rounded-xl p-4 active:opacity-80 mt-1"
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-background text-center font-semibold text-base">
                Cadastrar Usuário por Código
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 pt-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Códigos cadastrados</Text>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={sortedCodes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
              ListEmptyComponent={
                <View className="items-center justify-center py-8">
                  <Text className="text-muted">Nenhum código cadastrado</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-foreground">{item.label}</Text>
                    <Text className="text-xs text-muted">{ROLE_LABEL[item.role as Role]}</Text>
                  </View>
                  <Text className="text-xs text-muted mt-1">
                    Status: {item.isActive ? "Ativo" : "Inativo"}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
