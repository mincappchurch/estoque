import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DashboardStats = {
  totalProducts: number;
  lowStockCount: number;
  todayWithdrawals: number;
};

export default function HomeScreen() {
  const colors = useColors();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockCount: 0,
    todayWithdrawals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from("vw_dashboard_stats").select("*").limit(1).maybeSingle();

      if (!error && data) {
        setStats({
          totalProducts: data.total_products ?? 0,
          lowStockCount: data.low_stock_count ?? 0,
          todayWithdrawals: data.today_withdrawals ?? 0,
        });
      }

      setIsLoading(false);
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const serviceTimes = ["08:30", "11:00", "17:00", "19:30"];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Find next service
  let nextService = serviceTimes[0];
  for (const time of serviceTimes) {
    const [hour, minute] = time.split(":").map(Number);
    if (currentHour < hour || (currentHour === hour && currentMinute < minute)) {
      nextService = time;
      break;
    }
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
            <Text className="text-base text-muted">
              Visão geral do estoque
            </Text>
          </View>

          {/* Stats Cards */}
          <View className="gap-4">
            {/* Total Products */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-1">Total de Produtos</Text>
                  <Text className="text-4xl font-bold text-foreground">
                    {stats.totalProducts}
                  </Text>
                </View>
                <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center">
                  <IconSymbol name="cube.box.fill" size={28} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* Low Stock Alert */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-1">Estoque Baixo</Text>
                  <Text className="text-4xl font-bold text-warning">
                    {stats.lowStockCount}
                  </Text>
                  {stats.lowStockCount > 0 && (
                    <Text className="text-xs text-warning mt-1">
                      ⚠️ Requer atenção
                    </Text>
                  )}
                </View>
                <View className="w-14 h-14 bg-warning/10 rounded-full items-center justify-center">
                  <IconSymbol name="exclamationmark.triangle.fill" size={28} color={colors.warning} />
                </View>
              </View>
            </View>

            {/* Today's Withdrawals */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-1">Saídas Hoje</Text>
                  <Text className="text-4xl font-bold text-foreground">
                    {stats.todayWithdrawals}
                  </Text>
                </View>
                <View className="w-14 h-14 bg-error/10 rounded-full items-center justify-center">
                  <IconSymbol name="arrow.down.circle.fill" size={28} color={colors.error} />
                </View>
              </View>
            </View>

            {/* Next Service */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-muted mb-1">Próximo Culto</Text>
                  <Text className="text-4xl font-bold text-foreground">
                    {nextService}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Domingo
                  </Text>
                </View>
                <View className="w-14 h-14 bg-success/10 rounded-full items-center justify-center">
                  <IconSymbol name="checkmark.circle.fill" size={28} color={colors.success} />
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Ações Rápidas</Text>
            
            <TouchableOpacity
              onPress={() => router.push("/products/entry")}
              className="bg-success rounded-xl p-4 active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <IconSymbol name="arrow.up.circle.fill" size={24} color="#FFFFFF" />
                  <Text className="font-semibold text-lg" style={{ color: '#FFFFFF' }}>
                    Registrar Entrada
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/withdrawal")}
              className="bg-primary rounded-xl p-4 active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <IconSymbol name="arrow.down.circle.fill" size={24} color="#FFFFFF" />
                  <Text className="text-background font-semibold text-lg">
                    Registrar Saída
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/inventory")}
              className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <IconSymbol name="cube.box.fill" size={24} color={colors.foreground} />
                  <Text className="text-foreground font-semibold text-lg">
                    Ver Estoque
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
