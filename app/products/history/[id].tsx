import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function ProductHistoryScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = id;

  const { data: product, isLoading: productLoading } = trpc.products.getById.useQuery({ id: productId });
  const { data: movements, isLoading: movementsLoading } = trpc.movements.getByProduct.useQuery({ 
    productId,
    limit: 100 
  });
  const { data: teams } = trpc.teams.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();

  const getTeamName = (teamId?: string | null) => {
    if (!teamId) return "-";
    return teams?.find((t) => t.id === teamId)?.name || "-";
  };

  const getUnitName = (unitId: string) => {
    return units?.find((u) => u.id === unitId)?.abbreviation || "";
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (productLoading || movementsLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!product) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-foreground text-lg">Produto não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row items-center gap-4 mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground flex-1">Histórico</Text>
          </View>
          
          {/* Product Info */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground">{product.name}</Text>
            <Text className="text-sm text-muted mt-1">
              Estoque atual: {product.currentQuantity} {getUnitName(product.unitId)}
            </Text>
          </View>
        </View>

        {/* Movements List */}
        <FlatList
          data={movements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <IconSymbol name="clock.fill" size={48} color={colors.muted} />
              <Text className="text-muted text-center mt-4">
                Nenhuma movimentação registrada
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      item.type === "entry" ? "bg-success/10" : "bg-error/10"
                    }`}
                  >
                    <IconSymbol
                      name={item.type === "entry" ? "arrow.up.circle.fill" : "arrow.down.circle.fill"}
                      size={20}
                      color={item.type === "entry" ? colors.success : colors.error}
                    />
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-foreground">
                      {item.type === "entry" ? "Entrada" : "Saída"}
                    </Text>
                    <Text className="text-xs text-muted">
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-lg font-bold ${
                    item.type === "entry" ? "text-success" : "text-error"
                  }`}
                >
                  {item.type === "entry" ? "+" : "-"}
                  {item.quantity} {getUnitName(product.unitId)}
                </Text>
              </View>

              {item.type === "withdrawal" && (
                <View className="gap-2 pt-2 border-t border-border">
                  {item.volunteerName && (
                    <View className="flex-row items-center gap-2">
                      <IconSymbol name="person.fill" size={16} color={colors.muted} />
                      <Text className="text-sm text-foreground">
                        <Text className="text-muted">Voluntário: </Text>
                        {item.volunteerName}
                      </Text>
                    </View>
                  )}
                  {item.teamId && (
                    <View className="flex-row items-center gap-2">
                      <IconSymbol name="person.3.fill" size={16} color={colors.muted} />
                      <Text className="text-sm text-foreground">
                        <Text className="text-muted">Time: </Text>
                        {getTeamName(item.teamId)}
                      </Text>
                    </View>
                  )}
                  {item.serviceTime && (
                    <View className="flex-row items-center gap-2">
                      <IconSymbol name="clock.fill" size={16} color={colors.muted} />
                      <Text className="text-sm text-foreground">
                        <Text className="text-muted">Culto: </Text>
                        {item.serviceTime}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {item.notes && (
                <View className="mt-2 pt-2 border-t border-border">
                  <Text className="text-sm text-muted italic">{item.notes}</Text>
                </View>
              )}
            </View>
          )}
        />
      </View>
    </ScreenContainer>
  );
}
