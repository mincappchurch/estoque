import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function UnitsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: units, isLoading } = trpc.units.list.useQuery();

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
              <Text className="text-3xl font-bold text-foreground">Unidades de Medida</Text>
              <Text className="text-sm text-muted mt-1">Gerenciar unidades cadastradas</Text>
            </View>
          </View>

          {/* Add New Unit Button */}
          <TouchableOpacity
            onPress={() => router.push("/add-unit" as any)}
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
              Nova Unidade
            </Text>
          </TouchableOpacity>
        </View>

        {/* Units List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={units}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, gap: 12 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <IconSymbol name="cube.box.fill" size={48} color={colors.muted} />
                <Text className="text-muted text-center mt-4">
                  Nenhuma unidade cadastrada
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/edit-unit?id=${item.id}`)}
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
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-semibold text-foreground">
                        {item.name}
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.primary + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>
                          {item.abbreviation}
                        </Text>
                      </View>
                    </View>
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
