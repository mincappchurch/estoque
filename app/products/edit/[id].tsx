import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { supabase } from "@/lib/supabase";

type ProductFormData = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  unitId: string;
  currentQuantity: string;
  minimumStock: string;
  unitCost: string | null;
  maxWithdrawalLimit: string | null;
};

type CategoryOption = { id: string; name: string };
type UnitOption = { id: string; abbreviation: string };

export default function EditProductScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = id;

  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [minimumStock, setMinimumStock] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [maxWithdrawalLimit, setMaxWithdrawalLimit] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;
      setIsLoading(true);

      const [{ data: productData }, { data: categoriesData }, { data: unitsData }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase.from("categories").select("id, name").order("name", { ascending: true }),
        supabase.from("units").select("id, abbreviation").order("name", { ascending: true }),
      ]);

      if (productData) {
        const normalized = {
          id: productData.id,
          name: productData.name,
          description: productData.description,
          categoryId: productData.category_id,
          unitId: productData.unit_id,
          currentQuantity: productData.current_quantity,
          minimumStock: productData.minimum_stock,
          unitCost: productData.unit_cost,
          maxWithdrawalLimit: productData.max_withdrawal_limit,
        } as ProductFormData;

        setProduct(normalized);
        setName(normalized.name);
        setDescription(normalized.description || "");
        setSelectedCategory(normalized.categoryId);
        setSelectedUnit(normalized.unitId);
        setMinimumStock(normalized.minimumStock);
        setUnitCost(normalized.unitCost || "");
        setMaxWithdrawalLimit(normalized.maxWithdrawalLimit || "");
      }

      setCategories((categoriesData ?? []) as CategoryOption[]);
      setUnits((unitsData ?? []) as UnitOption[]);
      setIsLoading(false);
    };

    loadData();
  }, [productId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Informe o nome do produto");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Erro", "Selecione uma categoria");
      return;
    }
    if (!selectedUnit) {
      Alert.alert("Erro", "Selecione uma unidade de medida");
      return;
    }
    if (!minimumStock || parseFloat(minimumStock) < 0) {
      Alert.alert("Erro", "Informe o estoque mínimo");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          category_id: selectedCategory,
          unit_id: selectedUnit,
          minimum_stock: minimumStock,
          unit_cost: unitCost || null,
          max_withdrawal_limit: maxWithdrawalLimit || null,
        })
        .eq("id", productId);

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert("Sucesso", "Produto atualizado com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao atualizar produto");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
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
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={() => router.back()}>
                <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-foreground">Editar Produto</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push(`/products/history/${productId}`)}
              className="px-4 py-2 bg-surface rounded-lg border border-border active:opacity-80"
            >
              <Text className="text-primary font-medium text-sm">Histórico</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          {/* Current Stock (Read-only) */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm text-muted mb-1">Estoque Atual</Text>
            <Text className="text-2xl font-bold text-foreground">
              {product.currentQuantity} {units?.find((u) => u.id === product.unitId)?.abbreviation}
            </Text>
            <Text className="text-xs text-muted mt-1">
              Use "Entrada" ou "Saída" para alterar o estoque
            </Text>
          </View>

          {/* Name */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Nome do Produto *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex: Café em Pó"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Description */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Descrição</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descrição do produto (opcional)"
              multiline
              numberOfLines={3}
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Categoria *</Text>
            <View className="gap-2">
              {categories?.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`rounded-xl p-4 border ${
                    selectedCategory === category.id
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
                      selectedCategory === category.id ? "text-background" : "text-foreground"
                    }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Unit */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Unidade de Medida *</Text>
            <View className="flex-row flex-wrap gap-2">
              {units?.map((unit) => (
                <TouchableOpacity
                  key={unit.id}
                  onPress={() => setSelectedUnit(unit.id)}
                  className={`rounded-xl px-6 py-3 border ${
                    selectedUnit === unit.id
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`text-base font-medium ${
                      selectedUnit === unit.id ? "text-background" : "text-foreground"
                    }`}
                  >
                    {unit.abbreviation}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Minimum Stock */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Estoque Mínimo *</Text>
            <TextInput
              value={minimumStock}
              onChangeText={setMinimumStock}
              placeholder="0"
              keyboardType="decimal-pad"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
            <Text className="text-xs text-muted">
              Você será alertado quando o estoque atingir este valor
            </Text>
          </View>

          {/* Unit Cost */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Custo Unitário (R$)</Text>
            <TextInput
              value={unitCost}
              onChangeText={setUnitCost}
              placeholder="0.00"
              keyboardType="decimal-pad"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Max Withdrawal Limit */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Limite Máximo de Saída</Text>
            <TextInput
              value={maxWithdrawalLimit}
              onChangeText={setMaxWithdrawalLimit}
              placeholder="0"
              keyboardType="decimal-pad"
              className="bg-surface rounded-xl px-4 py-4 text-foreground text-base border border-border"
              placeholderTextColor={colors.muted}
            />
            <Text className="text-xs text-muted">
              Quantidade máxima que pode ser retirada por vez
            </Text>
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
                Salvar Alterações
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
