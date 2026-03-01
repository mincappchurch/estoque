import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TeamsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: teams, isLoading } = trpc.teams.list.useQuery();

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center gap-4 mb-4">
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
              <Text className="text-3xl font-bold text-foreground">Times</Text>
              <Text className="text-sm text-muted mt-1">Gerenciar times cadastrados</Text>
            </View>
          </View>

          {/* Add New Team Button */}
          <TouchableOpacity
            onPress={() => router.push("/add-team" as any)}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Novo Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Teams List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={teams}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <IconSymbol name="person.fill" size={48} color={colors.muted} />
                <Text className="text-muted text-center mt-4">
                  Nenhum time cadastrado
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/edit-team?id=${item.id}`)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 gap-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text className="text-sm text-muted" numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <View className="ml-4">
                    <IconSymbol name="pencil" size={20} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
