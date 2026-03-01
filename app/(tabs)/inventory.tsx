import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { Product } from "@/drizzle/schema";
import { supabase } from "@/lib/supabase";

type CategoryOption = { id: string; name: string };
type UnitOption = { id: string; abbreviation: string };

export default function InventoryScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingError(null);
      const [productsResult, categoriesResult, unitsResult] = await Promise.all([
        supabase.from("products").select("*").order("name", { ascending: true }),
        supabase.from("categories").select("id, name").order("name", { ascending: true }),
        supabase.from("units").select("id, abbreviation").order("name", { ascending: true }),
      ]);

      if (productsResult.error || categoriesResult.error || unitsResult.error) {
        setLoadingError(
          productsResult.error?.message || categoriesResult.error?.message || unitsResult.error?.message || "Erro ao carregar estoque",
        );
        setProducts([]);
        setCategories([]);
        setUnits([]);
        setLoading(false);
        return;
      }

      const productsData = productsResult.data;
      const categoriesData = categoriesResult.data;
      const unitsData = unitsResult.data;

      const normalizedProducts = (productsData ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        categoryId: row.category_id,
        unitId: row.unit_id,
        currentQuantity: row.current_quantity,
        minimumStock: row.minimum_stock,
        unitCost: row.unit_cost,
        maxWithdrawalLimit: row.max_withdrawal_limit,
        photoUrl: row.photo_url,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      })) as Product[];

      setProducts(normalizedProducts);
      setCategories((categoriesData ?? []) as CategoryOption[]);
      setUnits((unitsData ?? []) as UnitOption[]);
      setLoading(false);
    };

    loadData();
  }, []);

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getUnitName = (unitId: string) => {
    return units?.find((u) => u.id === unitId)?.abbreviation || "";
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find((c) => c.id === categoryId)?.name || "";
  };

  const isLowStock = (product: Product) => {
    return parseFloat(product.currentQuantity) <= parseFloat(product.minimumStock);
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (loadingError) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-warning text-center">Erro ao carregar listagem: {loadingError}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 gap-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-foreground">Estoque</Text>
              <Text className="text-sm text-muted mt-1">
                {filteredProducts?.length || 0} produtos
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push("/products/add")}
              className="w-12 h-12 bg-primary rounded-full items-center justify-center active:opacity-80"
            >
              <IconSymbol name="plus.circle.fill" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-3 border border-border">
            <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar produtos..."
              placeholderTextColor={colors.muted}
              className="flex-1 text-foreground text-base"
            />
          </View>

          {/* Category Filters */}
          {categories && categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === null ? "bg-primary" : "bg-surface border border-border"
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedCategory === null ? "text-background" : "text-foreground"
                  }`}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === category.id
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedCategory === category.id ? "text-background" : "text-foreground"
                    }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Products List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <IconSymbol name="cube.box.fill" size={48} color={colors.muted} />
              <Text className="text-muted text-center mt-4">
                {searchQuery || selectedCategory
                  ? "Nenhum produto encontrado"
                  : "Nenhum produto cadastrado"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push(`/products/edit/${item.id}`)}
              className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
            >
              <View className="flex-row gap-4">
                {/* Product Image */}
                <View className="w-20 h-20 bg-background rounded-lg items-center justify-center overflow-hidden">
                  {item.photoUrl ? (
                    <Image
                      source={{ uri: item.photoUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <IconSymbol name="cube.box.fill" size={32} color={colors.muted} />
                  )}
                </View>

                {/* Product Info */}
                <View className="flex-1 justify-between">
                  <View>
                    <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
                    <Text className="text-sm text-muted mt-1">
                      {getCategoryName(item.categoryId)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`text-2xl font-bold ${
                          isLowStock(item) ? "text-warning" : "text-foreground"
                        }`}
                      >
                        {parseFloat(item.currentQuantity).toFixed(0)}
                      </Text>
                      <Text className="text-sm text-muted">{getUnitName(item.unitId)}</Text>
                    </View>

                    {isLowStock(item) && (
                      <View className="bg-warning/10 px-3 py-1 rounded-full flex-row items-center gap-1">
                        <IconSymbol
                          name="exclamationmark.triangle.fill"
                          size={12}
                          color={colors.warning}
                        />
                        <Text className="text-xs text-warning font-medium">Baixo</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </ScreenContainer>
  );
}
