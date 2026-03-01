import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { supabase } from "@/lib/supabase";

type ProductData = {
  id: string;
  name: string;
  unitId: string;
  currentQuantity: string;
};

type MovementData = {
  id: string;
  type: "entry" | "withdrawal";
  quantity: string;
  volunteerName: string | null;
  teamId: string | null;
  serviceTime: string | null;
  notes: string | null;
  createdAt: string;
};

type TeamData = { id: string; name: string };
type UnitData = { id: string; abbreviation: string };

export default function ProductHistoryScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = id;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [units, setUnits] = useState<UnitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;
      setLoading(true);

      const [
        { data: productRow },
        { data: movementRows },
        { data: teamRows },
        { data: unitRows },
      ] = await Promise.all([
        supabase.from("products").select("id, name, unit_id, current_quantity").eq("id", productId).single(),
        supabase
          .from("movements")
          .select("id, type, quantity, volunteer_name, team_id, service_time, notes, created_at")
          .eq("product_id", productId)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("teams").select("id, name").order("name", { ascending: true }),
        supabase.from("units").select("id, abbreviation").order("name", { ascending: true }),
      ]);

      if (productRow) {
        setProduct({
          id: productRow.id,
          name: productRow.name,
          unitId: productRow.unit_id,
          currentQuantity: productRow.current_quantity,
        });
      }

      const normalizedMovements = (movementRows ?? []).map((row: any) => ({
        id: row.id,
        type: row.type,
        quantity: row.quantity,
        volunteerName: row.volunteer_name,
        teamId: row.team_id,
        serviceTime: row.service_time,
        notes: row.notes,
        createdAt: row.created_at,
      })) as MovementData[];

      setMovements(normalizedMovements);
      setTeams((teamRows ?? []) as TeamData[]);
      setUnits((unitRows ?? []) as UnitData[]);
      setLoading(false);
    };

    loadData();
  }, [productId]);

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

  if (loading) {
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
