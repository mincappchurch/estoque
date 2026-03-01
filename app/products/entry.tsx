import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { Product } from "@/drizzle/schema";

export default function ProductEntryScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const { data: products } = trpc.products.list.useQuery();
  const { data: units } = trpc.units.list.useQuery();

  const createMovement = trpc.movements.createEntry.useMutation({
    onSuccess: () => {
      Alert.alert("Sucesso", "Entrada registrada com sucesso!");
      utils.products.list.invalidate();
      utils.dashboard.stats.invalidate();
      router.back();
    },
    onError: (error: any) => {
      Alert.alert("Erro", error.message);
    },
  });

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnitName = (unitId: string) => {
    return units?.find((u) => u.id === unitId)?.abbreviation || "";
  };

  const handleSubmit = () => {
    if (!selectedProduct) {
      Alert.alert("Erro", "Selecione um produto");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert("Erro", "Informe uma quantidade válida");
      return;
    }

    createMovement.mutate({
      productId: selectedProduct.id,
      quantity,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row items-center gap-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Entrada de Produtos</Text>
        </View>

        {!selectedProduct ? (
          <View className="flex-1 p-6 gap-4">
            {/* Search */}
            <View className="bg-surface rounded-xl px-4 py-3 flex-row items-center gap-3 border border-border">
              <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar produto..."
                placeholderTextColor={colors.muted}
                className="flex-1 text-foreground text-base"
              />
            </View>

            {/* Product List */}
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedProduct(item)}
                  className="bg-surface rounded-xl p-4 border border-border active:opacity-80"
                >
                  <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-sm text-muted mt-1">
                    Estoque atual: {item.currentQuantity} {getUnitName(item.unitId)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center py-12">
                  <Text className="text-muted text-base">Nenhum produto encontrado</Text>
                </View>
              }
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
            {/* Selected Product */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-semibold text-foreground">
                  {selectedProduct.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                  <Text className="text-primary font-medium">Alterar</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-muted">
                Estoque atual: {selectedProduct.currentQuantity} {getUnitName(selectedProduct.unitId)}
              </Text>
            </View>

            {/* Quantity */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Quantidade a Adicionar *
              </Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                keyboardType="decimal-pad"
                className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
                placeholderTextColor={colors.muted}
              />
              {quantity && parseFloat(quantity) > 0 && (
                <Text className="text-sm text-success">
                  Novo estoque: {(parseFloat(selectedProduct.currentQuantity) + parseFloat(quantity)).toFixed(2)}{" "}
                  {getUnitName(selectedProduct.unitId)}
                </Text>
              )}
            </View>

            {/* Notes */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Observações</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Observações sobre a entrada (opcional)"
                multiline
                numberOfLines={3}
                className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
                placeholderTextColor={colors.muted}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={createMovement.isPending}
              className="bg-primary rounded-xl p-4 active:opacity-80 mt-4"
            >
              {createMovement.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-background text-center font-semibold text-lg">
                  Registrar Entrada
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
