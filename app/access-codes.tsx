import { useEffect, useMemo, useState } from "react";
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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { hash } from "bcryptjs";

type Role = "admin" | "volunteer" | "team_leader";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  volunteer: "Voluntário",
  team_leader: "Líder de Time",
};

type AccessCodeItem = {
  id: string;
  label: string;
  role: Role;
  is_active: boolean;
  created_at: string;
};

export default function AccessCodesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<Role>("volunteer");
  const [accessCodes, setAccessCodes] = useState<AccessCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAccessCodes = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("access_codes")
      .select("id, label, role, is_active, created_at")
      .order("created_at", { ascending: false });
    setAccessCodes((data ?? []) as AccessCodeItem[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAccessCodes();
  }, [isAdmin]);

  const sortedCodes = useMemo(() => {
    return [...(accessCodes ?? [])].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [accessCodes]);

  const handleCreate = async () => {
    if (!label.trim()) {
      Alert.alert("Erro", "Informe o nome do usuário");
      return;
    }

    if (!code.trim() || code.trim().length < 4) {
      Alert.alert("Erro", "Informe um código com pelo menos 4 caracteres");
      return;
    }

    try {
      setSaving(true);
      const normalizedCode = code.trim().toUpperCase();
      const codeHash = await hash(normalizedCode, 10);
      const { error } = await supabase.from("access_codes").insert({
        label: label.trim(),
        code_hash: codeHash,
        role,
        is_active: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      setLabel("");
      setCode("");
      setRole("volunteer");
      await loadAccessCodes();
      Alert.alert("Sucesso", "Usuário com código de acesso cadastrado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao cadastrar código");
    } finally {
      setSaving(false);
    }
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

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !isAdmin ? (
          <View className="px-6 pt-6">
            <View className="bg-surface rounded-xl p-4 border border-warning/40">
              <Text className="text-warning font-medium">Acesso restrito</Text>
              <Text className="text-sm text-muted mt-1">
                Apenas administrador pode cadastrar usuários por código.
              </Text>
            </View>
          </View>
        ) : (
        <>
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
            disabled={saving}
            className="bg-primary rounded-xl p-4 active:opacity-80 mt-1"
          >
            {saving ? (
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
                    <Text className="text-xs text-muted">{ROLE_LABEL[item.role]}</Text>
                  </View>
                  <Text className="text-xs text-muted mt-1">
                    Status: {item.is_active ? "Ativo" : "Inativo"}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
        </>
        )}
      </View>
    </ScreenContainer>
  );
}
