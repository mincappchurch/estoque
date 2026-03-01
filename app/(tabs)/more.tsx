import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";

export default function MoreScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  
  // Check if user is admin (based on name or openId)
  const isAdmin = user?.name === "Administrador" || user?.openId?.includes("admin");

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Mais</Text>
            <Text className="text-base text-muted">
              Configurações e opções
            </Text>
          </View>

          {/* User Info */}
          {user && (
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <View className="flex-row items-center gap-4">
                <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center">
                  <IconSymbol name="person.fill" size={32} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">
                    {user.name || "Usuário"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Options - Only show for admin */}
          {isAdmin && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Gerenciamento</Text>
              
              <TouchableOpacity
                onPress={() => router.push("/teams")}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <IconSymbol name="person.fill" size={24} color={colors.foreground} />
                    <Text className="text-foreground font-semibold text-base">
                      Gerenciar Times
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/access-codes")}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <IconSymbol name="person.fill" size={24} color={colors.foreground} />
                    <Text className="text-foreground font-semibold text-base">
                      Usuários por Código
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/categories")}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <IconSymbol name="cube.box.fill" size={24} color={colors.foreground} />
                    <Text className="text-foreground font-semibold text-base">
                      Gerenciar Categorias
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/units")}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <IconSymbol name="ruler.fill" size={24} color={colors.foreground} />
                    <Text className="text-foreground font-semibold text-base">
                      Gerenciar Unidades
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/backup")}
                className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <IconSymbol name="arrow.up.doc.fill" size={24} color={colors.success} />
                    <Text className="text-foreground font-semibold text-base">
                      Backup de Dados
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Settings */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Configurações</Text>
            
            <TouchableOpacity
              className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <IconSymbol name="gear" size={24} color={colors.foreground} />
                  <Text className="text-foreground font-semibold text-base">
                    Preferências
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error/10 rounded-xl p-4 border border-error/20 active:opacity-80 mt-auto"
          >
            <Text className="text-error text-center font-semibold text-base">
              Sair
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
