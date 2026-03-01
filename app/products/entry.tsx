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
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { Product } from "@/drizzle/schema";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

type ProductOption = Product;
type UnitOption = { id: string; abbreviation: string };

export default function ProductEntryScreen() {
  const colors = useColors();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from("products").select("*").order("name", { ascending: true });
      const normalized = (data ?? []).map((row: any) => ({
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
      })) as ProductOption[];
      setProducts(normalized);
    };

    const loadUnits = async () => {
      const { data } = await supabase
        .from("units")
        .select("id, abbreviation")
        .order("name", { ascending: true });
      setUnits((data ?? []) as UnitOption[]);
    };

    loadProducts();
    loadUnits();
  }, []);

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnitName = (unitId: string) => {
    return units?.find((u) => u.id === unitId)?.abbreviation || "";
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      Alert.alert("Erro", "Selecione um produto");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert("Erro", "Informe uma quantidade válida");
      return;
    }

    if (!user?.id) {
      Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.rpc("fn_record_movement", {
        p_product_id: selectedProduct.id,
        p_type: "entry",
        p_quantity: quantity,
        p_user_id: user.id,
        p_notes: notes.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert("Sucesso", "Entrada registrada com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao registrar entrada");
    } finally {
      setSaving(false);
    }
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
              disabled={saving}
              className="bg-primary rounded-xl p-4 active:opacity-80 mt-4"
            >
              {saving ? (
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
