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
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { Product } from "@/drizzle/schema";

export default function InventoryScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();

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

  if (productsLoading || categoriesLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
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
